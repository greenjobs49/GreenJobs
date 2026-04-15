import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import GoogleRoleModal from "./GoogleRoleModal";

// role prop — passed from signup pages (e.g. role="recruiter")
// when role is provided, it's sent directly to the backend and the modal is skipped
const GoogleSignIn = ({ role = null }) => {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [googleToken,   setGoogleToken]   = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const redirectMap = {
    jobseeker: "/jobseeker/dashboard",
    recruiter: "/recruiter/dashboard",
    business:  "/business/dashboard",
    admin:     "/admin",
  };

  const handleSuccess = async (credentialResponse) => {
    try {
      const payload = { token: credentialResponse.credential };

      // If a role is already known from the signup page, send it immediately
      if (role) payload.role = role;

      const res = await apiClient.post("/auth/google", payload);

      // Backend still needs a role (e.g. on login pages where role isn't known)
      if (res.data.requireRole) {
        setGoogleToken(credentialResponse.credential);
        setShowRoleModal(true);
        return;
      }

      login(res.data.user, res.data.token);
      navigate(redirectMap[res.data.user.role] || "/dashboard");
    } catch {
      toast.error("Google sign-in failed");
    }
  };

  const handleRoleSubmit = async (selectedRole) => {
    try {
      const res = await apiClient.post("/auth/google", {
        token: googleToken,
        role:  selectedRole,
      });

      login(res.data.user, res.data.token);
      setShowRoleModal(false);
      navigate(redirectMap[res.data.user.role] || "/dashboard");
    } catch {
      toast.error("Google signup failed");
    }
  };

  return (
    <>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error("Google sign-in failed")}
        width="100%"
      />
      {showRoleModal && <GoogleRoleModal onSubmit={handleRoleSubmit} />}
    </>
  );
};

export default GoogleSignIn;