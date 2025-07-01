import { useState } from "react"
import React from 'react';
// import '../styles/SignupForm.css'
const APP_URL=import.meta.env.VITE_APP_URL

const SignupForm = () => {
    const [formData, setFormData] = useState({ username: "", password: "", })
    const [message, setMessage] = useState("")

    // Handle input changes
    const handleChange = (event) => {
        const { name, value } = event.target

        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }))
    }

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault(); // Prevents page refresh
        console.log("User Input:", formData); // Logs user input

        try {
            const response = await fetch(`${APP_URL}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (response.ok) {
                setMessage({ type: "success", text: "Signup successful!" })
            } else {
                setMessage({ type: "error", text: data.error || "Signup failed." })
            }
        } catch (error) {
            setMessage({ type: "error", text: "Network error. Please try again." })
        }
    }

    return (
        <form className="signup-form" onSubmit={handleSubmit}>
            <label htmlFor="username">Username</label>
            <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
            />
            <label htmlFor="password">Password</label>
            <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
            />
            <div className="form-buttons">
                <button type="submit">Sign Up</button>
            </div>
            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}
        </form>
    )
}

export default SignupForm
