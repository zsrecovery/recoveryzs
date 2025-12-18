// app/components/Recaptcha.tsx
import React, { forwardRef } from "react";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { auth } from "@/firebaseConfig";

// Forward ref allows the parent component to trigger the Recaptcha modal
const Recaptcha = forwardRef<any>((props, ref) => { 
  // Use your Firebase config
  //optional: makes recaptcha invisible
  return (
    <FirebaseRecaptchaVerifierModal
      ref={ref}
      firebaseConfig={auth.app.options}
      attemptInvisibleVerification={true}
    />
  );
});

export default Recaptcha;
