import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../contexts/UserContext';
const APP_URL=import.meta.env.VITE_APP_URL

const WithAuth = (WrappedComponent) => {
    return function ProtectedComponent(props) {
        const { user, setUser } = useUser();
        const navigate = useNavigate();

        useEffect(() => {
            if (!user) {
                fetch(`${APP_URL}/me`, { credentials: "include" })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.id) { // Ensure the response contains the user id
                            setUser(data); // Set the user in context
                        } else {
                            navigate("/login");
                        }
                    })
                    .catch(() => {
                        navigate("/login");
                    });
            }
        }, [user, setUser, navigate]);

        if (!user) {
            return <p>Loading...</p>; // Prevents flickering
        }

        return <WrappedComponent {...props} />;
    };
};

export default WithAuth;
