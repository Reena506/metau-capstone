import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from '../contexts/UserContext';


const LoginForm = () => {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const { setUser } = useUser();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: "success", text: "Login successful!" });
                setUser(data); // Set the user in context with id and username
                navigate("/"); // Redirect to the homepage
            } else {
                setMessage({ type: "error", text: data.error || "Login failed." });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Network error. Please try again." });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="login-form">
            <label>
                Username:
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />
            </label>

            <label>
                Password:
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
            </label>

            <button type="submit">Log In</button>

            {message && (
                <p className={`message ${message.type}`}>{message.text}</p>
            )}
        </form>
    );
};

export default LoginForm;
