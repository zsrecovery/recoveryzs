// app/components/Recaptcha.tsx
import React, { forwardRef } from "react";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { auth } from "@/firebaseConfig";

const Recaptcha = forwardRef<any>((props, ref) => {
  return <FirebaseRecaptchaVerifierModal ref={ref} firebaseConfig={auth.app.options} />;
});

export default Recaptcha;
