import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const url = await Linking.getInitialURL();

        if (!url) return;

        const token = url.split("access_token=")[1]?.split("&")[0];

        if (!token) {
          console.log("No Google token found");
          return;
        }

        const googleUser = await fetch(
          "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const profile = await googleUser.json();
        console.log("Google profile:", profile);

        const response = await fetch(
          "https://spotrr-api.safeadlist10.repl.co/google-auth",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: profile.email,
              name: profile.name,
              googleId: profile.id,
              dateOfBirth: null
            }),
          }
        );

        const data = await response.json();
        console.log("Backend response:", data);

        router.replace("/(tabs)");
      } catch (error) {
        console.log("Auth error:", error);
      }
    };

    handleAuth();
  }, [router]);

  return null;
}