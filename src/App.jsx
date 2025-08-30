import React, { useState, useEffect, useMemo } from 'react';
import { motion } from "framer-motion";

// --- MOCK DATA ---
const mockUsers = [
    { id: 1, name: 'Admin User', email: 'admin@devnovate.com', password: 'password123', role: 'admin' },
    { id: 2, name: 'John Doe', email: 'john@devnovate.com', password: 'password123', role: 'user' },
];

const mockBlogs = [
    { id: 1, title: 'Understanding the MERN Stack', content: 'The MERN stack is a popular choice for building modern web applications...', author: 'John Doe', authorId: 2, date: '2025-08-28T10:00:00Z', status: 'published', likes: 150, comments: [], category: 'Web Development' },
    { id: 2, title: 'A Guide to JWT Authentication', content: 'JSON Web Tokens are a compact, URL-safe means of representing claims...', author: 'Admin User', authorId: 1, date: '2025-08-29T11:30:00Z', status: 'published', likes: 250, comments: [], category: 'Security' },
    { id: 3, title: 'React Hooks Explained', content: 'Hooks are a new addition in React 16.8. They let you use state and other React features without writing a class...', author: 'John Doe', authorId: 2, date: '2025-08-30T09:00:00Z', status: 'pending', likes: 0, comments: [], category: 'React' },
    { id: 4, title: 'Building a REST API with Node.js and Express', content: 'Node.js and Express make it incredibly easy to build scalable and fast APIs...', author: 'Admin User', authorId: 1, date: '2025-08-25T14:00:00Z', status: 'published', likes: 180, comments: [], category: 'Backend' },
    { id: 5, title: 'Introduction to MongoDB', content: 'MongoDB is a source-available cross-platform document-oriented database program...', author: 'John Doe', authorId: 2, date: '2025-08-26T16:45:00Z', status: 'published', likes: 95, comments: [], category: 'Database' },
    { id: 6, title: 'Responsive Design with Tailwind CSS', content: 'Tailwind CSS is a utility-first CSS framework packed with classes...', author: 'Admin User', authorId: 1, date: '2025-08-27T18:00:00Z', status: 'rejected', likes: 0, comments: [], category: 'CSS' },
];


// --- ANIMATED CARD COMPONENTS (MODIFIED) ---

const cardVariants = {
    offscreen: {
        y: 300,
        opacity: 0,
    },
    onscreen: {
        y: 50,
        opacity: 1,
        rotate: -10,
        transition: {
            type: "spring",
            bounce: 0.4,
            duration: 0.8,
        },
    },
};

const colorPalette = ['#050A30', '#000C66', '#0000FF', '#7EC8E3'];

const AnimatedBlogCard = ({ blog, index }) => {
    // Dynamically create a gradient from the new palette
    const color1 = colorPalette[index % colorPalette.length];
    const color2 = colorPalette[(index + 1) % colorPalette.length];
    const background = `linear-gradient(306deg, ${color1}, ${color2})`;

    return (
        <motion.div
            style={cardContainer}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: false, amount: 0.8 }} // 1. Re-triggers animation on scroll
            className="flex justify-center items-center"
        >
            <div style={{ ...splash, background }} />
            <motion.div style={cardStyle} variants={cardVariants}>
                <div className="p-6 text-gray-100">
                    <h3 className="text-2xl font-bold mb-2 truncate">{blog.title}</h3>
                    <p className="text-blue-300 mb-4 text-sm">by {blog.author}</p>
                    <p className="text-gray-300 leading-relaxed line-clamp-4">{blog.content.substring(0, 150)}...</p>
                </div>
            </motion.div>
        </motion.div>
    );
};


// --- UI COMPONENTS ---

const Header = ({ currentUser, onLogout, onNavigate }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const navLinks = [
        { name: 'Home', page: 'home' },
        { name: 'Create Blog', page: 'createBlog' },
    ];

    if (currentUser?.role === 'admin') {
        navLinks.push({ name: 'Admin Dashboard', page: 'admin' });
    }

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <span className="text-2xl font-bold text-indigo-600 cursor-pointer" onClick={() => onNavigate('home')}>Devnovate</span>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {navLinks.map(link => (
                                <a key={link.name} onClick={() => onNavigate(link.page)} className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer">{link.name}</a>
                            ))}
                        </div>
                    </div>
                    <div className="hidden md:block">
                        {currentUser ? (
                            <div className="flex items-center">
                                <span className="text-gray-800 text-sm font-medium mr-4 cursor-pointer" onClick={() => onNavigate('profile')}>Welcome, {currentUser.name}</span>
                                <button onClick={onLogout} className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Logout</button>
                            </div>
                        ) : (
                            <div>
                                <button onClick={() => onNavigate('login')} className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">Login</button>
                                <button onClick={() => onNavigate('signup')} className="ml-4 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Sign Up</button>
                            </div>
                        )}
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        <button onClick={() => setMenuOpen(!menuOpen)} className="bg-gray-100 inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <span className="sr-only">Open main menu</span>
                            <svg className={`${menuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            <svg className={`${menuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            </nav>
            {menuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map(link => (
                            <a key={link.name} onClick={() => { onNavigate(link.page); setMenuOpen(false); }} className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium cursor-pointer">{link.name}</a>
                        ))}
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-200">
                        {currentUser ? (
                            <div className="px-2">
                                <p className="text-gray-800 font-medium cursor-pointer" onClick={() => onNavigate('profile')}>Welcome, {currentUser.name}</p>
                                <button onClick={onLogout} className="mt-2 w-full text-left bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Logout</button>
                            </div>
                        ) : (
                            <div className="px-2">
                                <button onClick={() => onNavigate('login')} className="w-full text-left text-gray-600 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium">Login</button>
                                <button onClick={() => onNavigate('signup')} className="mt-2 w-full text-left bg-indigo-600 text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-700">Sign Up</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

const HomePage = ({ blogs, onNavigate }) => {
    const trendingBlogs = useMemo(() => [...blogs].sort((a, b) => b.likes - a.likes).slice(0, 3), [blogs]);
    const latestBlogs = useMemo(() => [...blogs].filter(b => b.status === 'published').sort((a, b) => new Date(b.date) - new Date(a.date)), [blogs]);

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Hero Section */}
            <div className="text-center py-16 md:py-24 bg-white shadow-sm">
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 tracking-tight">Welcome to <span className="text-indigo-600">Devnovate</span></h1>
                <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">The future of collaborative development blogging.</p>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Trending Blogs Section */}
                <section>
                    <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Trending Blogs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {trendingBlogs.map(blog => (
                            <div key={blog.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1" onClick={() => onNavigate('blogDetail', blog.id)}>
                                <div className="p-6">
                                    <span className="text-sm text-indigo-500 font-semibold">{blog.category}</span>
                                    <h3 className="text-xl font-bold text-gray-900 mt-2 mb-3 truncate">{blog.title}</h3>
                                    <p className="text-gray-600 text-sm">by {blog.author}</p>
                                    <div className="mt-4 flex items-center justify-between text-gray-500">
                                        <span className="text-sm">{blog.likes} Likes</span>
                                        <span className="text-sm">{new Date(blog.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Latest Blogs Section with Animation */}
                <section className="mt-20">
                    <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Latest Articles</h2>
                     <div style={animationContainer}>
                        {latestBlogs.map((blog, i) => (
                           <AnimatedBlogCard key={blog.id} blog={blog} index={i} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

const BlogDetailPage = ({ blog, onNavigate }) => {
    if (!blog) return <div><p>Blog not found.</p><button onClick={() => onNavigate('home')}>Go Home</button></div>;

    return (
        <div className="bg-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button onClick={() => onNavigate('home')} className="mb-8 text-indigo-600 hover:text-indigo-800 font-semibold">&larr; Back to Home</button>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{blog.title}</h1>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                    <span>By {blog.author}</span>
                    <span className="mx-2">&bull;</span>
                    <span>{new Date(blog.date).toLocaleDateString()}</span>
                    <span className="mx-2">&bull;</span>
                    <span>{blog.likes} Likes</span>
                </div>
                <div className="mt-8 prose prose-indigo lg:prose-xl max-w-none">
                    <p>{blog.content}</p>
                </div>
            </div>
        </div>
    );
};

const CreateBlogPage = ({ currentUser, onBlogSubmit, onNavigate }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !content || !category) {
            alert("Please fill all fields.");
            return;
        }
        onBlogSubmit({ title, content, category, author: currentUser.name, authorId: currentUser.id });
        onNavigate('profile');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create a New Blog</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="title" className="sr-only">Title</label>
                            <input id="title" name="title" type="text" required value={title} onChange={e => setTitle(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Blog Title" />
                        </div>
                        <div>
                            <label htmlFor="category" className="sr-only">Category</label>
                            <input id="category" name="category" type="text" required value={category} onChange={e => setCategory(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Category (e.g., Web Development)" />
                        </div>
                        <div>
                            <label htmlFor="content" className="sr-only">Content</label>
                            <textarea id="content" name="content" rows="10" required value={content} onChange={e => setContent(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Write your blog content here... Supports Markdown."></textarea>
                        </div>
                    </div>

                    <div>
                        <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Submit for Approval
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminDashboard = ({ blogs, onUpdateBlogStatus }) => {
    const pendingBlogs = blogs.filter(b => b.status === 'pending');
    const publishedBlogs = blogs.filter(b => b.status === 'published');

    const handleStatusUpdate = (blogId, status) => {
        onUpdateBlogStatus(blogId, status);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold mb-4">Pending Submissions ({pendingBlogs.length})</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pendingBlogs.map(blog => (
                                <tr key={blog.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{blog.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.author}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleStatusUpdate(blog.id, 'published')} className="text-green-600 hover:text-green-900 mr-4">Approve</button>
                                        <button onClick={() => handleStatusUpdate(blog.id, 'rejected')} className="text-red-600 hover:text-red-900">Reject</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Published Articles ({publishedBlogs.length})</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {publishedBlogs.map(blog => (
                                <tr key={blog.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{blog.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.author}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleStatusUpdate(blog.id, 'hidden')} className="text-yellow-600 hover:text-yellow-900 mr-4">Hide</button>
                                        <button onClick={() => handleStatusUpdate(blog.id, 'deleted')} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ProfilePage = ({ currentUser, blogs }) => {
    const userBlogs = blogs.filter(b => b.authorId === currentUser.id);

    const getStatusChip = (status) => {
        switch (status) {
            case 'published': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Published</span>;
            case 'pending': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
            case 'rejected': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
            default: return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">My Profile</h1>
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-semibold">{currentUser.name}</h2>
                <p className="text-gray-600">{currentUser.email}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">My Submissions</h2>
                <ul className="divide-y divide-gray-200">
                    {userBlogs.map(blog => (
                        <li key={blog.id} className="py-4 flex justify-between items-center">
                            <span className="font-medium text-gray-800">{blog.title}</span>
                            {getStatusChip(blog.status)}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const AuthPage = ({ onAuth, onNavigate }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAuth({ email, password, name }, isLogin ? 'login' : 'signup');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {isLogin ? 'Sign in to your account' : 'Create a new account'}
                </h2>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {!isLogin && (
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                <div className="mt-1">
                                    <input id="name" name="name" type="text" required value={name} onChange={e => setName(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                            <div className="mt-1">
                                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="mt-1">
                                <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                        <div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                {isLogin ? 'Sign in' : 'Sign up'}
                            </button>
                        </div>
                    </form>
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or</span></div>
                        </div>
                        <div className="mt-6 text-center">
                            <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-indigo-600 hover:text-indigo-500">
                                {isLogin ? 'create a new account' : 'sign in to your existing account'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [page, setPage] = useState({ currentPage: 'home', props: null });
    const [blogs, setBlogs] = useState(mockBlogs);
    const [users, setUsers] = useState(mockUsers);
    const [currentUser, setCurrentUser] = useState(null); // Set to null initially

    // Simulate checking for a logged-in user on component mount
    useEffect(() => {
        const loggedInUser = sessionStorage.getItem('devnovateUser');
        if (loggedInUser) {
            setCurrentUser(JSON.parse(loggedInUser));
        }
    }, []);

    const handleNavigate = (newPage, props = null) => {
        if ((newPage === 'createBlog' || newPage === 'profile' || newPage === 'admin') && !currentUser) {
            setPage({ currentPage: 'login', props: null });
            return;
        }
        setPage({ currentPage: newPage, props });
    };

    const handleAuth = (credentials, type) => {
        if (type === 'login') {
            const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
            if (user) {
                setCurrentUser(user);
                sessionStorage.setItem('devnovateUser', JSON.stringify(user)); // Persist user session
                handleNavigate('home');
            } else {
                alert('Invalid credentials.');
            }
        } else { // signup
            const existingUser = users.find(u => u.email === credentials.email);
            if (existingUser) {
                alert('User with this email already exists.');
                return;
            }
            const newUser = { id: Date.now(), ...credentials, role: 'user' };
            setUsers([...users, newUser]);
            setCurrentUser(newUser);
            sessionStorage.setItem('devnovateUser', JSON.stringify(newUser));
            handleNavigate('home');
        }
    };
    
    const handleLogout = () => {
        setCurrentUser(null);
        sessionStorage.removeItem('devnovateUser');
        handleNavigate('home');
    };

    const handleBlogSubmit = (newBlogData) => {
        const newBlog = {
            id: Date.now(),
            ...newBlogData,
            date: new Date().toISOString(),
            status: 'pending',
            likes: 0,
            comments: [],
        };
        setBlogs([...blogs, newBlog]);
    };

    const handleUpdateBlogStatus = (blogId, status) => {
        setBlogs(blogs.map(blog => {
            if (blog.id === blogId) {
                if (status === 'deleted') return null; // We'll filter this out
                return { ...blog, status };
            }
            return blog;
        }).filter(Boolean));
    };

    const renderPage = () => {
        const { currentPage, props } = page;
        switch (currentPage) {
            case 'home':
                return <HomePage blogs={blogs} onNavigate={handleNavigate} />;
            case 'blogDetail':
                const blog = blogs.find(b => b.id === props);
                return <BlogDetailPage blog={blog} onNavigate={handleNavigate} />;
            case 'createBlog':
                return <CreateBlogPage currentUser={currentUser} onBlogSubmit={handleBlogSubmit} onNavigate={handleNavigate} />;
            case 'admin':
                return <AdminDashboard blogs={blogs} onUpdateBlogStatus={handleUpdateBlogStatus} />;
            case 'profile':
                return <ProfilePage currentUser={currentUser} blogs={blogs} />;
            case 'login':
            case 'signup':
                return <AuthPage onAuth={handleAuth} onNavigate={handleNavigate} />;
            default:
                return <HomePage blogs={blogs} onNavigate={handleNavigate} />;
        }
    };

    return (
        <div>
            <Header currentUser={currentUser} onLogout={handleLogout} onNavigate={handleNavigate} />
            <main>
                {renderPage()}
            </main>
        </div>
    );
};


// --- STYLES FOR ANIMATION (MODIFIED) ---

const animationContainer = {
    margin: "100px auto",
    maxWidth: 500,
    paddingBottom: 100,
    width: "100%",
};

const cardContainer = {
    overflow: "hidden",
    position: "relative",
    paddingTop: 20,
    marginBottom: -120,
};

const splash = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    clipPath: `path("M 0 303.5 C 0 292.454 8.995 285.101 20 283.5 L 460 219.5 C 470.085 218.033 480 228.454 480 239.5 L 500 430 C 500 441.046 491.046 450 480 450 L 20 450 C 8.954 450 0 441.046 0 430 Z")`,
};

// 2. Updated card styling with new palette
const cardStyle = {
    width: 380,
    height: 430,
    borderRadius: 20,
    backgroundColor: "#050A30",
    boxShadow: "0 0 20px rgba(126, 200, 227, 0.4)", // A glow effect using the light blue
    transformOrigin: "10% 60%",
};

export default App;

