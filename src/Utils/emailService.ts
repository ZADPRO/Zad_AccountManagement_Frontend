import emailjs from "@emailjs/browser";

export const sendWelcomeEmail = async (
  email: string,
  tempPassword: string
) => {
  console.log("EMAILJS SERVICE:", import.meta.env.VITE_EMAILJS_SERVICE_ID);
  console.log("EMAILJS TEMPLATE:", import.meta.env.VITE_EMAILJS_TEMPLATE_ID);
  console.log("EMAILJS PUBLIC:", import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

  return emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    {
      user_email: email,
      temp_password: tempPassword,
    },
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  );
};