import { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:8080/api/v1/forgot-password', { email });
            setMsg({ type: 'success', text: res.data.message });
        } catch (err:unknown) {
            if (axios.isAxiosError(err)) {
                console.error(err.response?.data?.message);
            } else {
                console.error("An unexpected error occurred");
            }
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <form onSubmit={handleRequest} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-xl font-bold mb-4">Reset Password</h2>
                <p className="text-sm text-gray-600 mb-4">Enter your email and we'll send you a reset link.</p>
                
                <input 
                    type="email" 
                    className="w-full p-2 border rounded mb-4" 
                    placeholder="Email Address"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                />

                <button 
                    disabled={loading}
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
                >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                {msg.text && (
                    <p className={`mt-4 text-center ${msg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {msg.text}
                    </p>
                )}
            </form>
        </div>
    );
};

export default ForgotPassword;