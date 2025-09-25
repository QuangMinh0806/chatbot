const FB_APP_ID = "4238615406374117";
const Url = `https://chatbotbe.haduyson.com`;
const REDIRECT_URI = `${Url}/facebook-pages/callback`;

const FB_SCOPE = "pages_show_list,pages_manage_metadata,pages_read_engagement,pages_messaging,email";

export default function LoginWithFb() {
    const handleLogin = () => {
        const fbLoginUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(
            REDIRECT_URI
        )}&scope=${FB_SCOPE}&response_type=code`;

        window.location.href = fbLoginUrl;
    };

    return (
        <button
            onClick={handleLogin}
            style={{
                padding: "10px 20px",
                backgroundColor: "#1877f2",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
            }}
        >
            Login with Facebook
        </button>
    );
}
