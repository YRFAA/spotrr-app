const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.API_PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "spotrr_jwt_secret_2024";

const pool = new Pool({
  host: process.env.PGHOST || "helium",
  port: parseInt(process.env.PGPORT || "5432"),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || "heliumdb",
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ===== AUTH =====

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "Missing fields" });

    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (existing.rows.length) return res.status(409).json({ error: "Email already in use" });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id",
      [email, hash]
    );
    const userId = rows[0].id;

    await pool.query(
      "INSERT INTO profiles (user_id, name) VALUES ($1,$2)",
      [userId, name]
    );
    await pool.query("INSERT INTO notification_preferences (user_id) VALUES ($1)", [userId]);
    await pool.query("INSERT INTO privacy_settings (user_id) VALUES ($1)", [userId]);

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, userId, isNewUser: true });
  } catch (e) {
    console.error("Signup error:", e);
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (!rows.length) return res.status(401).json({ error: "Invalid credentials" });
    const user = rows[0];
    if (user.is_deactivated) return res.status(403).json({ error: "Account deactivated" });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, userId: user.id });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ error: "Login failed" });
  }
});

// ===== PROFILE =====

app.get("/api/profile/me", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, u.email, u.is_premium, u.is_deactivated
       FROM profiles p JOIN users u ON u.id=p.user_id
       WHERE p.user_id=$1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Profile not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

app.put("/api/profile/me", auth, async (req, res) => {
  try {
    const { name, age, bio, gym, location, latitude, longitude, distance_radius,
            workout_frequency, goals, muscle_groups, availability, training_times, photos } = req.body;

    const { rows } = await pool.query(
      `UPDATE profiles SET
        name=COALESCE($1, name),
        age=COALESCE($2, age),
        bio=COALESCE($3, bio),
        gym=COALESCE($4, gym),
        location=COALESCE($5, location),
        latitude=COALESCE($6, latitude),
        longitude=COALESCE($7, longitude),
        distance_radius=COALESCE($8, distance_radius),
        workout_frequency=COALESCE($9, workout_frequency),
        goals=COALESCE($10, goals),
        muscle_groups=COALESCE($11, muscle_groups),
        availability=COALESCE($12, availability),
        training_times=COALESCE($13, training_times),
        photos=COALESCE($14, photos),
        updated_at=NOW()
       WHERE user_id=$15 RETURNING *`,
      [name, age, bio, gym, location, latitude, longitude, distance_radius,
       workout_frequency, goals, muscle_groups, availability, training_times, photos, req.user.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ===== DISCOVER =====

app.get("/api/discover", auth, async (req, res) => {
  try {
    const { gym, goals } = req.query;
    let query = `
      SELECT p.*, u.is_premium FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id != $1
        AND p.name IS NOT NULL
        AND u.is_active = TRUE
        AND u.is_deactivated = FALSE
        AND p.user_id NOT IN (
          SELECT swiped_id FROM swipes WHERE swiper_id=$1
        )
    `;
    const params = [req.user.id];
    if (gym) { query += ` AND p.gym ILIKE $${params.length+1}`; params.push(`%${gym}%`); }
    query += " ORDER BY p.updated_at DESC LIMIT 50";
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to get discover feed" });
  }
});

// ===== SWIPES / MATCHING =====

app.post("/api/swipe", auth, async (req, res) => {
  try {
    const { swipedId, direction } = req.body;
    if (!swipedId || !direction) return res.status(400).json({ error: "Missing fields" });
    if (swipedId === req.user.id) return res.status(400).json({ error: "Cannot swipe yourself" });

    await pool.query(
      "INSERT INTO swipes (swiper_id, swiped_id, direction) VALUES ($1,$2,$3) ON CONFLICT (swiper_id, swiped_id) DO UPDATE SET direction=$3",
      [req.user.id, swipedId, direction]
    );

    let matched = false;
    let matchId = null;
    let conversationId = null;

    if (direction === "right") {
      const mutual = await pool.query(
        "SELECT id FROM swipes WHERE swiper_id=$1 AND swiped_id=$2 AND direction='right'",
        [swipedId, req.user.id]
      );
      if (mutual.rows.length) {
        const u1 = Math.min(req.user.id, swipedId);
        const u2 = Math.max(req.user.id, swipedId);
        const existing = await pool.query(
          "SELECT id FROM matches WHERE user1_id=$1 AND user2_id=$2",
          [u1, u2]
        );
        if (!existing.rows.length) {
          const { rows: mRows } = await pool.query(
            "INSERT INTO matches (user1_id, user2_id) VALUES ($1,$2) RETURNING id",
            [u1, u2]
          );
          matchId = mRows[0].id;
          const { rows: cRows } = await pool.query(
            "INSERT INTO conversations (match_id) VALUES ($1) RETURNING id",
            [matchId]
          );
          conversationId = cRows[0].id;
          matched = true;
        } else {
          matchId = existing.rows[0].id;
        }
      }
    }

    res.json({ matched, matchId, conversationId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Swipe failed" });
  }
});

// ===== MATCHES =====

app.get("/api/matches", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.id as match_id, m.created_at as matched_at,
        CASE WHEN m.user1_id=$1 THEN m.user2_id ELSE m.user1_id END as other_user_id,
        p.name, p.photos, p.gym,
        c.id as conversation_id,
        (SELECT content FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND sender_id!=$1 AND read_at IS NULL) as unread_count
       FROM matches m
       JOIN conversations c ON c.match_id=m.id
       JOIN profiles p ON p.user_id=(CASE WHEN m.user1_id=$1 THEN m.user2_id ELSE m.user1_id END)
       WHERE m.user1_id=$1 OR m.user2_id=$1
       ORDER BY COALESCE(last_message_at, m.created_at) DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to get matches" });
  }
});

// ===== CHAT =====

app.get("/api/conversations/:id/messages", auth, async (req, res) => {
  try {
    const convId = parseInt(req.params.id);
    const conv = await pool.query(
      `SELECT c.id FROM conversations c
       JOIN matches m ON m.id=c.match_id
       WHERE c.id=$1 AND (m.user1_id=$2 OR m.user2_id=$2)`,
      [convId, req.user.id]
    );
    if (!conv.rows.length) return res.status(403).json({ error: "Access denied" });

    await pool.query(
      "UPDATE messages SET read_at=NOW() WHERE conversation_id=$1 AND sender_id!=$2 AND read_at IS NULL",
      [convId, req.user.id]
    );

    const { rows } = await pool.query(
      "SELECT * FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC",
      [convId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

app.post("/api/conversations/:id/messages", auth, async (req, res) => {
  try {
    const convId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Empty message" });

    const conv = await pool.query(
      `SELECT c.id FROM conversations c
       JOIN matches m ON m.id=c.match_id
       WHERE c.id=$1 AND (m.user1_id=$2 OR m.user2_id=$2)`,
      [convId, req.user.id]
    );
    if (!conv.rows.length) return res.status(403).json({ error: "Access denied" });

    const { rows } = await pool.query(
      "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1,$2,$3) RETURNING *",
      [convId, req.user.id, content.trim()]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ===== SETTINGS =====

app.get("/api/settings/notifications", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM notification_preferences WHERE user_id=$1",
      [req.user.id]
    );
    res.json(rows[0] || {});
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

app.put("/api/settings/notifications", auth, async (req, res) => {
  try {
    const { likes_notif, matches_notif, messages_notif, reminders_notif } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO notification_preferences (user_id, likes_notif, matches_notif, messages_notif, reminders_notif)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id) DO UPDATE SET
         likes_notif=EXCLUDED.likes_notif,
         matches_notif=EXCLUDED.matches_notif,
         messages_notif=EXCLUDED.messages_notif,
         reminders_notif=EXCLUDED.reminders_notif
       RETURNING *`,
      [req.user.id, likes_notif, matches_notif, messages_notif, reminders_notif]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/settings/privacy", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM privacy_settings WHERE user_id=$1",
      [req.user.id]
    );
    res.json(rows[0] || {});
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

app.put("/api/settings/privacy", auth, async (req, res) => {
  try {
    const { profile_visible, show_distance, show_age, discoverable, message_permissions } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO privacy_settings (user_id, profile_visible, show_distance, show_age, discoverable, message_permissions)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (user_id) DO UPDATE SET
         profile_visible=EXCLUDED.profile_visible,
         show_distance=EXCLUDED.show_distance,
         show_age=EXCLUDED.show_age,
         discoverable=EXCLUDED.discoverable,
         message_permissions=EXCLUDED.message_permissions
       RETURNING *`,
      [req.user.id, profile_visible, show_distance, show_age, discoverable, message_permissions]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

// ===== ACCOUNT MANAGEMENT =====

app.post("/api/account/deactivate", auth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE users SET is_deactivated=TRUE, is_active=FALSE WHERE id=$1",
      [req.user.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to deactivate" });
  }
});

app.delete("/api/account/delete", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id=$1", [req.user.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

app.put("/api/account/premium", auth, async (req, res) => {
  try {
    const { is_premium } = req.body;
    await pool.query(
      "UPDATE users SET is_premium=$1, premium_expires_at=CASE WHEN $1 THEN NOW() + INTERVAL '30 days' ELSE NULL END WHERE id=$2",
      [is_premium, req.user.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to update premium status" });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, "localhost", () => {
  console.log(`Spotrr API running on port ${PORT}`);
});
