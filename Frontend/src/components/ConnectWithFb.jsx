import { useNavigate } from "react-router-dom";

const FB_APP_ID = "1130979465654370";
const REDIRECT_URI = "http://localhost:8000/api/auth/facebook/callback";
const FB_SCOPE = "pages_manage_metadata,pages_read_engagement,pages_messaging,email";

export default function ConnectWithFb() {
    const navigate = useNavigate();
    const handleLogin = () => {
        const fbLoginUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(
            REDIRECT_URI
        )}&scope=${FB_SCOPE}&response_type=code`;

        window.location.href = fbLoginUrl;
        navigate('/admin/facebook_page')
    };

    return (
        <button
            onClick={handleLogin}
            className="px-5 py-2 bg-[#1877f2] text-white rounded-md hover:bg-[#166fe5] transition-colors duration-200 cursor-pointer"
        >
            Connect with Facebook
        </button>

    );
}