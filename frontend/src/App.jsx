import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

// =================================================================
// 1. AUTHENTICATION CONTEXT & PROVIDER
// =================================================================
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    const url = `http://localhost:5000/api${endpoint}`;
    // Always prefer the latest token from state, fallback to localStorage
    const authToken = token !== null ? token : localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const options = { method, headers };
    if (body) { options.body = JSON.stringify(body); }

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API call to ${endpoint} failed`);
    }
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : { success: true };
    } catch (e) {
      return { success: true };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      setUser(data.user); setToken(data.token);
      localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.message };
    }
  };

  const register = async (userData) => {
     try {
      const response = await fetch('http://localhost:5000/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData), });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      setUser(data.user); setToken(data.token);
      localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('token'); localStorage.removeItem('user');
  };

  const authContextValue = { user, token, isAuthenticated: !!token, login, register, logout, apiCall };
  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => { return useContext(AuthContext); };

// =================================================================
// SHARED UI COMPONENTS
// =================================================================
const Spinner = ({ className = "h-5 w-5" }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const UserAvatar = ({ user }) => (
  <div className="w-8 h-8 rounded-full bg-brand-card-blue-dark flex items-center justify-center text-white font-bold text-sm select-none">
    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
  </div>
);

// =================================================================
// CUSTOM HOOK: useIntersectionObserver
// =================================================================
const useIntersectionObserver = (options) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsIntersecting(true); observer.unobserve(entry.target); }
    }, options);
    const currentRef = ref.current;
    if (currentRef) { observer.observe(currentRef); }
    return () => { if (currentRef) { observer.unobserve(currentRef); } };
  }, [ref, options]);
  return [ref, isIntersecting];
};

// =================================================================
// START: LANDING PAGE COMPONENTS
// =================================================================
const Header = ({ onNavigate }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => { setIsScrolled(window.scrollY > 10); };
    window.addEventListener('scroll', handleScroll);
    return () => { window.removeEventListener('scroll', handleScroll); };
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ease-in-out ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-center items-center h-20">
          <div className="text-2xl font-bold tracking-tight text-gray-900">
            Devnovate<span className="text-brand-primary">.</span>
          </div>
          <nav className="absolute right-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <UserAvatar user={user} />
                <span className="text-sm font-medium text-gray-900 hidden sm:block">Hi, {user?.firstName}!</span>
                <button onClick={logout} className="px-5 py-2 text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50/50 transition-colors">Logout</button>
              </div>
            ) : (
              <button onClick={() => onNavigate('login')} className="px-5 py-2 text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50/50 transition-colors">Sign In</button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

const HeroSection = ({ onNavigate }) => {
  return (
    <section className="bg-white text-center py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 opacity-50"><div className="w-96 h-96 bg-brand-light-blue rounded-full animate-shape-float1"></div></div>
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 opacity-50"><div className="w-96 h-96 bg-brand-primary/20 rounded-full animate-shape-float2"></div></div>
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tighter text-gray-900 animate-fade-in-down-slow">Share your story with the world</h1>
        <p className="max-w-2xl mx-auto mt-6 text-lg text-gray-600 animate-fade-in-down-normal">Build a beautiful, personalized blog that fits your brand. Join a community of creators and share your passion.</p>
        <div className="animate-fade-in-down-fast">
          <button onClick={() => onNavigate('login')} className="inline-block mt-8 px-8 py-3 text-lg font-semibold text-white bg-brand-primary rounded-lg shadow-md hover:bg-red-700 transform hover:-translate-y-1 transition-all">Get Started</button>
        </div>
      </div>
    </section>
  );
};

const ShowcaseCard = ({ title, description, image, imageSide, bgColor, textColor }) => {
  const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0.1 });
  const flexDirection = imageSide === 'right' ? 'md:flex-row' : 'md:flex-row-reverse';
  return (
    <div ref={ref} className={`flex flex-col ${flexDirection} items-center gap-8 md:gap-16 ${bgColor} ${textColor} rounded-2xl shadow-xl p-8 md:p-12 transition-opacity duration-700 ease-out ${isIntersecting ? 'animate-slide-up-fade-in' : 'opacity-0'}`}>
      <div className="flex-1"><h2 className="text-3xl font-bold mb-4">{title}</h2><p className="text-lg leading-relaxed opacity-80">{description}</p></div>
      <div className={`flex-1 w-full max-w-sm ${textColor} opacity-80`}>{image}</div>
    </div>
  );
};

const ShowcaseSection = () => {
  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <ShowcaseCard title="Design your space" description="Bring your blog to life with a stunning design. Choose from a library of easy-to-use templates with flexible layouts." imageSide="right" bgColor="bg-brand-primary" textColor="text-white" image={<svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 30H80V40H20V30ZM20 50H60V60H20V50ZM20 70H80V80H20V70Z"/></svg>} />
        <ShowcaseCard title="Track your growth" description="See where your audience is coming from and what they’re interested in with our built-in analytics." imageSide="left" bgColor="bg-brand-card-blue-dark" textColor="text-white" image={<svg viewBox="0 0 100 100" stroke="currentColor" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 80C30 80 40 40 50 40C60 40 70 80 80 80" strokeWidth="8" strokeLinecap="round"/></svg>} />
        <ShowcaseCard title="Focus on your passion" description="We handle the rest. Spend less time managing your site and more time creating amazing content." imageSide="right" bgColor="bg-brand-card-blue-light" textColor="text-gray-900" image={<svg viewBox="0 0 100 100" stroke="currentColor" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 20L80 80H20L50 20Z" strokeWidth="8" strokeLinejoin="round"/></svg>} />
      </div>
    </section>
  );
};

const CTASection = ({ onNavigate }) => {
  return (
    <section className="bg-white text-center py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-gray-900">Join the community</h2>
        <button onClick={() => onNavigate('login')} className="inline-block mt-8 px-10 py-4 text-xl font-semibold text-white bg-brand-primary rounded-lg shadow-md hover:bg-red-700 transform hover:-translate-y-1 transition-all">Create your blog</button>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 text-center py-8">
      <div className="max-w-6xl mx-auto px-4"><p className="text-gray-600">&copy; {new Date().getFullYear()} Devnovate. Built with passion.</p></div>
    </footer>
  );
};


// =================================================================
// START: LOGIN PAGE COMPONENTS
// =================================================================
const AuthInput = ({ id, label, type = 'text', placeholder, value, onChange }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-900">{label}</label>
    <div className="mt-1"><input id={id} name={id} type={type} required placeholder={placeholder} value={value} onChange={onChange} className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm placeholder-gray-600/50 focus:outline-none focus:ring-brand-card-blue-dark focus:border-brand-card-blue-dark transition-colors" /></div>
  </div>
);

const UserLoginForm = ({ onSwitchToRegister, onLoginSuccess }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) { onLoginSuccess(result.user); }
      else { setError(result.message || 'Invalid credentials.'); }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form className="space-y-6 animate-form-fade-in" onSubmit={handleSubmit}>
      <AuthInput id="email" label="Email address" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} />
      <AuthInput id="password" label="Password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} />
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      <div className="flex items-center justify-between"><div className="text-sm"><a href="#" className="font-medium text-brand-card-blue-dark hover:text-brand-dark-blue">Forgot password?</a></div></div>
      <div><button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-red-700 disabled:bg-red-400 transition-colors">{isLoading && <Spinner className="-ml-1 mr-3 h-5 w-5" />} {isLoading ? 'Signing In...' : 'Sign In'}</button></div>
      <p className="text-center text-sm text-gray-600">Don't have an account? <button onClick={onSwitchToRegister} type="button" className="font-medium text-brand-card-blue-dark hover:text-brand-dark-blue">Create one</button></p>
    </form>
  );
};

const UserRegisterForm = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      const result = await register(formData);
      if (result.success) { onRegisterSuccess(result.user); }
      else { setError(result.message || 'Registration failed.'); }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form className="space-y-6 animate-form-fade-in" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <AuthInput id="firstName" label="First Name" placeholder="Ada" value={formData.firstName} onChange={handleChange} />
        <AuthInput id="lastName" label="Last Name" placeholder="Lovelace" value={formData.lastName} onChange={handleChange} />
      </div>
      <AuthInput id="username" label="Username" placeholder="ada_lovelace" value={formData.username} onChange={handleChange}/>
      <AuthInput id="email" label="Email address" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange}/>
      <AuthInput id="password" label="Password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange}/>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      <div><button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-red-700 disabled:bg-red-400 transition-colors">{isLoading && <Spinner className="-ml-1 mr-3 h-5 w-5" />} {isLoading ? 'Creating Account...' : 'Create Account'}</button></div>
      <p className="text-center text-sm text-gray-600">Already have an account? <button onClick={onSwitchToLogin} type="button" className="font-medium text-brand-card-blue-dark hover:text-brand-dark-blue">Sign In</button></p>
    </form>
  );
};

const AdminLoginForm = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) { onLoginSuccess(result.user); }
      else { setError(result.message || 'Invalid credentials.'); }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form className="space-y-6 animate-form-fade-in" onSubmit={handleSubmit}>
      <h2 className="text-center text-lg font-semibold text-gray-900">Admin Portal</h2>
      <AuthInput id="email" label="Admin Email" type="email" placeholder="admin@devnovate.com" value={formData.email} onChange={handleChange}/>
      <AuthInput id="password" label="Password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange}/>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      <div><button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-gray-900 hover:bg-gray-700 disabled:bg-gray-600 transition-colors">{isLoading && <Spinner className="-ml-1 mr-3 h-5 w-5" />} {isLoading ? 'Signing In...' : 'Sign in as Admin'}</button></div>
    </form>
  );
};

const LoginPage = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState('user');
  const [formType, setFormType] = useState('login');
  return (
     <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center text-4xl font-extrabold tracking-tight text-gray-900 animate-fade-in-down-slow">Devnovate<span className="text-brand-primary">.</span></div>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-slide-up-fade-in">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <div className="flex mb-8">
            <button onClick={() => setAuthMode('user')} className={`w-full py-3 text-sm font-semibold transition-colors ${authMode === 'user' ? 'border-b-2 border-brand-primary text-brand-primary' : 'border-b-2 border-gray-200 text-gray-600 hover:border-gray-300'}`}>User</button>
            <button onClick={() => setAuthMode('admin')} className={`w-full py-3 text-sm font-semibold transition-colors ${authMode === 'admin' ? 'border-b-2 border-brand-primary text-brand-primary' : 'border-b-2 border-gray-200 text-gray-600 hover:border-gray-300'}`}>Admin</button>
          </div>
          {authMode === 'user' ? ( formType === 'login' ? <UserLoginForm onSwitchToRegister={() => setFormType('register')} onLoginSuccess={onLoginSuccess}/> : <UserRegisterForm onSwitchToLogin={() => setFormType('login')} onRegisterSuccess={onLoginSuccess}/>) : <AdminLoginForm onLoginSuccess={onLoginSuccess}/>}
        </div>
      </div>
    </div>
  );
};


// =================================================================
// START: ADMIN DASHBOARD COMPONENTS
// =================================================================
const AdminHeader = () => {
  const { user, logout } = useAuth();
  return (
    <header className="bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <UserAvatar user={user} />
            <span className='hidden sm:inline'>Welcome, {user?.firstName}</span>
            <button onClick={logout} className="px-4 py-2 text-sm bg-brand-primary rounded hover:bg-red-700 transition-colors">Logout</button>
          </div>
        </div>
      </div>
    </header>
  );
};

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const { apiCall } = useAuth();
  useEffect(() => {
    apiCall('/admin/analytics').then(data => setStats(data.analytics)).catch(err => console.error("Failed to fetch admin stats:", err));
  }, [apiCall]);

  if (!stats) return <div className="p-8 text-center text-gray-600 flex items-center justify-center gap-2"><Spinner className='h-6 w-6 text-gray-600' /> Loading stats...</div>;

  const statItems = [
    { label: 'Total Users', value: stats.overview.totalUsers, color: 'bg-brand-dark-blue', textColor: 'text-white' }, 
    { label: 'Total Blogs', value: stats.overview.totalBlogs, color: 'bg-brand-card-blue-dark', textColor: 'text-white' },
    { label: 'Pending Blogs', value: stats.overview.pendingBlogs, color: 'bg-brand-card-blue-light', textColor: 'text-gray-900' },
    { label: 'Approved Blogs', value: stats.overview.publishedBlogs, color: 'bg-brand-primary', textColor: 'text-white' },
  ];

  return (
    <div className="p-8"><h2 className="text-2xl font-bold mb-6 text-gray-900">Dashboard Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up-fade-in">
        {statItems.map(item => (<div key={item.label} className={`p-6 rounded-lg shadow-lg ${item.color} ${item.textColor}`}><div className="text-4xl font-extrabold">{item.value}</div><div className="text-lg opacity-80">{item.label}</div></div>))}
      </div>
    </div>
  );
};

const PendingBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { apiCall } = useAuth();
  const fetchPending = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiCall('/admin/blogs/pending');
      setBlogs(data.blogs || []);
    } catch (error) { console.error("Failed to fetch pending blogs:", error); setBlogs([]); } 
    finally { setIsLoading(false); }
  }, [apiCall]);

  useEffect(() => { fetchPending(); }, [fetchPending]);
  
  const handleApprove = async (blogId) => { try { await apiCall(`/admin/blogs/${blogId}/approve`, 'PUT'); await fetchPending(); } catch (error) { console.error("Failed to approve blog:", error); } };
  const handleReject = async (blogId) => { try { await apiCall(`/admin/blogs/${blogId}/reject`, 'PUT'); await fetchPending(); } catch (error) { console.error("Failed to reject blog:", error); } };

  if (isLoading) { return <div className="p-8 text-center text-gray-600 flex items-center justify-center gap-2"><Spinner className='h-6 w-6 text-gray-600' /> Loading pending blogs...</div>; }

  return (
    <div className="p-8"><h2 className="text-2xl font-bold mb-6 text-gray-900">Pending Blog Posts</h2>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {blogs.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {blogs.map(blog => (
              <li key={blog.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div>
                  <p className="font-semibold text-lg text-gray-900">{blog.title}</p>
                  <p className="text-sm text-gray-600">by {blog.author.firstName} {blog.author.lastName}</p>
                </div>
                <div className="flex gap-2 self-end sm:self-center">
                  <button onClick={() => handleApprove(blog.id)} className="px-4 py-2 text-sm font-bold text-white bg-green-500 rounded hover:bg-green-600 transition-colors">Approve</button>
                  <button onClick={() => handleReject(blog.id)} className="px-4 py-2 text-sm font-bold text-white bg-brand-primary rounded hover:bg-red-700 transition-colors">Reject</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (<div className="p-8 text-center text-gray-600"><h3 className="text-lg font-semibold">All Clear!</h3><p>There are no pending blogs to review.</p></div>)}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex">
        <aside className="w-64 bg-white shadow h-[calc(100vh-4rem)] sticky top-16 p-4">
          <nav>
            <ul>
              <li><button onClick={() => setActiveTab('dashboard')} className={`w-full text-left p-3 rounded font-semibold transition-colors ${activeTab === 'dashboard' ? 'bg-gray-50 text-brand-primary' : 'hover:bg-gray-50/50'}`}>Dashboard</button></li>
              <li><button onClick={() => setActiveTab('pending')} className={`w-full text-left p-3 rounded font-semibold transition-colors ${activeTab === 'pending' ? 'bg-gray-50 text-brand-primary' : 'hover:bg-gray-50/50'}`}>Pending Blogs</button></li>
            </ul>
        </nav></aside>
        <main className="flex-1">
          {activeTab === 'dashboard' && <AdminStats />}
          {activeTab === 'pending' && <PendingBlogs />}
        </main>
      </div>
    </div>
  );
};


// =================================================================
// START: USER DASHBOARD COMPONENTS
// =================================================================
const BlogCard = ({ blog, onNavigate }) => (
  <button onClick={() => onNavigate('blogDetail', { blogId: blog.id })} className="text-left w-full bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
    <img className="w-full h-48 object-cover bg-gray-200" src={blog.featuredImage || `https://picsum.photos/seed/${blog.id}/800/600`} alt={blog.title} />
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{blog.title}</h3>
      <p className="text-gray-600 mb-4 line-clamp-3 text-sm">{blog.excerpt || 'No excerpt available.'}</p>
      <div className="text-sm text-gray-600 flex justify-between items-center pt-4 border-t border-gray-200">
        <span>By {blog.author.firstName}</span>
        <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  </button>
);

const BlogFeed = ({ onNavigate }) => {
  const [allBlogs, setAllBlogs] = useState([]);
  const [displayedBlogs, setDisplayedBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('latest');
  const { apiCall } = useAuth();

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      try {
        const data = await apiCall('/blogs?status=approved');
        setAllBlogs(data.blogs);
      } catch (error) { 
        console.error("Failed to fetch blogs:", error); 
        setAllBlogs([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, [apiCall]);

  useEffect(() => {
    if (activeSubTab === 'latest') {
      const sortedByDate = [...allBlogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDisplayedBlogs(sortedByDate);
    } else if (activeSubTab === 'popular') {
      const sortedByLikes = [...allBlogs].sort((a, b) => b.likesCount - a.likesCount);
      setDisplayedBlogs(sortedByLikes);
    }
  }, [activeSubTab, allBlogs]);

  const commonTabClass = "px-4 py-2 text-sm font-semibold rounded-md transition-colors";
  const activeTabClass = "bg-brand-card-blue-dark text-white";
  const inactiveTabClass = "text-gray-600 hover:bg-gray-200";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h2 className="text-3xl font-extrabold text-gray-900">Discover Posts</h2>
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
          <button onClick={() => setActiveSubTab('latest')} className={`${commonTabClass} ${activeSubTab === 'latest' ? activeTabClass : inactiveTabClass}`}>Latest</button>
          <button onClick={() => setActiveSubTab('popular')} className={`${commonTabClass} ${activeSubTab === 'popular' ? activeTabClass : inactiveTabClass}`}>Popular</button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse"><div className="h-48 bg-gray-200 rounded mb-4"></div><div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div><div className="h-4 bg-gray-200 rounded w-1/2"></div></div>
          ))}
        </div>
      ) : displayedBlogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedBlogs.map(blog => <BlogCard key={blog.id} blog={blog} onNavigate={onNavigate} />)}
        </div>
      ) : (
        <div className="text-center p-12 bg-white rounded-lg shadow-md"><h3 className="text-xl font-semibold text-gray-900">Nothing to see here yet!</h3><p className="text-gray-600 mt-2">No blogs have been published in this category.</p></div>
      )}
    </div>
  );
};

const MyPostCard = ({ blog }) => {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
  };
  return (
    <li className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center transition-shadow hover:shadow-lg">
      <div>
        <h3 className="font-bold text-lg text-gray-900">{blog.title}</h3>
        <p className="text-sm text-gray-600">Created: {new Date(blog.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${statusStyles[blog.status] || statusStyles.draft}`}>
          {blog.status}
        </span>
        <button className="text-sm font-semibold text-brand-card-blue-dark hover:underline">Edit</button>
      </div>
    </li>
  );
};

const MyPosts = () => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { apiCall, user } = useAuth();

  useEffect(() => {
    const fetchMyBlogs = async () => {
      setIsLoading(true);
      const statusQuery = statusFilter ? `&status=${statusFilter}` : '';
      try {
        const data = await apiCall(`/blogs?author=${user.id}${statusQuery}`);
        setBlogs(data.blogs);
      } catch (error) { console.error("Failed to fetch your posts:", error); setBlogs([]);
      } finally { setIsLoading(false); }
    };
    if (user?.id) { fetchMyBlogs(); }
  }, [apiCall, user, statusFilter]);
  
  const filters = ['', 'approved', 'pending', 'rejected', 'draft'];
  const commonFilterClass = "px-4 py-2 text-sm font-semibold rounded-md transition-colors";
  const activeFilterClass = "bg-brand-primary text-white shadow-md";
  const inactiveFilterClass = "bg-white text-gray-600 hover:bg-gray-100 shadow-sm border";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8">My Posts</h2>
      <div className="flex flex-wrap gap-2 mb-8">
        {filters.map(filter => (
          <button key={filter} onClick={() => setStatusFilter(filter)} className={`${commonFilterClass} ${statusFilter === filter ? activeFilterClass : inactiveFilterClass}`}>
            {filter === '' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="text-center p-8 text-gray-600"><Spinner className="h-8 w-8 mx-auto text-gray-400" /></div>
      ) : blogs.length > 0 ? (
        <ul className="space-y-4 animate-slide-up-fade-in">
          {blogs.map(blog => <MyPostCard key={blog.id} blog={blog} />)}
        </ul>
      ) : (
        <div className="text-center p-12 bg-white rounded-lg shadow-md animate-slide-up-fade-in">
          <h3 className="text-xl font-semibold text-gray-900">You haven't created any posts with this status.</h3>
          <p className="text-gray-600 mt-2">Try selecting another filter or click "Create Post" to get started!</p>
        </div>
      )}
    </div>
  );
};

const CreateBlogForm = ({ onPostCreated }) => {
  const [formData, setFormData] = useState({ title: '', content: '', excerpt: '', tags: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { apiCall } = useAuth();
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleSubmit = async (e) => {
    e.preventDefault(); setIsLoading(true);
    try {
      const postData = { ...formData, tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) };
      await apiCall('/blogs', 'POST', postData);
      alert('Blog submitted for approval!');
      onPostCreated();
    } catch (error) {
      console.error("Failed to create post:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-slide-up-fade-in">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Create a New Post</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-6">
        <AuthInput id="title" label="Title" placeholder="My Awesome Blog Post" value={formData.title} onChange={handleChange} />
        <AuthInput id="excerpt" label="Excerpt (Short Summary)" placeholder="A brief summary of your post..." value={formData.excerpt} onChange={handleChange} />
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-900">Content (Markdown supported)</label>
          <textarea name="content" id="content" rows="10" value={formData.content} onChange={handleChange} className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm p-2" required></textarea>
        </div>
        <AuthInput id="tags" label="Tags (comma-separated)" placeholder="tech, react, javascript" value={formData.tags} onChange={handleChange} />
        <button type="submit" disabled={isLoading} className="px-6 py-3 font-bold text-white bg-brand-primary rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center">{isLoading && <Spinner className="-ml-1 mr-3 h-5 w-5" />} {isLoading ? 'Submitting...' : 'Submit for Approval'}</button>
      </form>
    </div>
  );
};

const UserDashboard = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  
  const commonTabClass = "font-semibold text-sm transition-colors";
  const activeTabClass = "text-brand-primary";
  const inactiveTabClass = "text-gray-600 hover:text-gray-900";
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Devnovate</h1>
            <nav className="flex items-center gap-6">
              <button onClick={() => setActiveTab('feed')} className={`${commonTabClass} ${activeTab === 'feed' ? activeTabClass : inactiveTabClass}`}>Feed</button>
              <button onClick={() => setActiveTab('my-posts')} className={`${commonTabClass} ${activeTab === 'my-posts' ? activeTabClass : inactiveTabClass}`}>My Posts</button>
              <button onClick={() => setActiveTab('create')} className={`px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-red-700 transition-colors`}>Create Post</button>
              <div className='flex items-center gap-4'>
                <UserAvatar user={user} />
                <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Logout</button>
              </div>
            </nav>
          </div>
        </div>
      </header>
      <main>
        {activeTab === 'feed' && <BlogFeed onNavigate={onNavigate} />}
        {activeTab === 'my-posts' && <MyPosts />}
        {activeTab === 'create' && <CreateBlogForm onPostCreated={() => setActiveTab('my-posts')} />}
      </main>
    </div>
  );
};


// =================================================================
// START: BLOG DETAIL PAGE COMPONENTS (ALL NEW)
// =================================================================
const LikeButton = ({ blogId, initialLikesCount, initialIsLiked }) => {
  const { apiCall, isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert("Please log in to like posts.");
      return;
    }
    
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      await apiCall(`/blogs/${blogId}/like`, 'POST');
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setIsLiked(isLiked);
      setLikesCount(likesCount);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors ${isLiked ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path></svg>
      <span>{likesCount}</span>
    </button>
  );
};

const Comment = ({ comment }) => (
  <div className="flex gap-4">
    <UserAvatar user={comment.author} />
    <div className="flex-1">
      <div className="bg-gray-100 p-3 rounded-lg">
        <p className="font-semibold text-gray-900">{comment.author.firstName} {comment.author.lastName}</p>
        <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
      </div>
      <p className="text-xs text-gray-500 mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
    </div>
  </div>
);

const CommentForm = ({ blogId, onCommentAdded }) => {
  const { apiCall, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !content.trim()) return;
    setIsLoading(true);
    try {
      const newComment = await apiCall('/comments', 'POST', { blogId, content });
      onCommentAdded(newComment.comment);
      setContent('');
    } catch (error) {
      console.error("Failed to post comment:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) return <p className="text-center text-gray-600 bg-gray-100 p-4 rounded-lg">Please sign in to leave a comment.</p>;

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-2">
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Add your comment..." required className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-card-blue-dark"></textarea>
      <button type="submit" disabled={isLoading} className="self-end px-6 py-2 bg-brand-primary text-white font-semibold rounded-md hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center">{isLoading && <Spinner className="mr-2" />} Post Comment</button>
    </form>
  );
};

const CommentSection = ({ blogId }) => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { apiCall } = useAuth();

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        // CORRECTED LINE: Added '/blog/' to the URL
        const data = await apiCall(`/comments/blog/${blogId}`);
        setComments(data.comments || []);
      } catch (error) { 
        console.error("Failed to fetch comments:", error);
        setComments([]);
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchComments();
  }, [apiCall, blogId]);

  const handleCommentAdded = (newComment) => {
    setComments(prev => [newComment, ...prev]);
  };

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Comments ({comments.length})</h3>
      <CommentForm blogId={blogId} onCommentAdded={handleCommentAdded} />
      <div className="mt-6 space-y-6">
        {isLoading ? <p>Loading comments...</p> : comments.map(comment => <Comment key={comment.id} comment={comment} />)}
      </div>
    </div>
  );
};

const BlogDetail = ({ blogId, onNavigate }) => {
  const [blog, setBlog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { apiCall } = useAuth();

  useEffect(() => {
    const fetchBlogDetail = async () => {
      setIsLoading(true);
      window.scrollTo(0, 0);
      try {
        const blogData = await apiCall(`/blogs/${blogId}`);
        setBlog(blogData.blog);
      } catch (error) {
        console.error("Failed to fetch blog detail:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogDetail();
  }, [apiCall, blogId]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner className="h-12 w-12 text-gray-900" /></div>;
  if (!blog) return <div className="min-h-screen text-center p-12"><h2>Post not found</h2><button onClick={() => onNavigate('dashboard')} className="mt-4 text-brand-primary">Go Back</button></div>;

  return (
    <div>
      <Header onNavigate={onNavigate} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button onClick={() => onNavigate('dashboard')} className="mb-8 font-semibold text-brand-card-blue-dark hover:underline">{"< Back to Feed"}</button>
        <article>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">{blog.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-8 border-b pb-4">
            <UserAvatar user={blog.author} />
            <div>
              <p className="font-semibold">{blog.author.firstName} {blog.author.lastName}</p>
              <p>{new Date(blog.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {blog.featuredImage && <img src={blog.featuredImage} alt={blog.title} className="w-full h-auto rounded-lg shadow-lg mb-8" />}
          <div className="prose prose-lg max-w-none mb-12 whitespace-pre-wrap">
            {blog.content}
          </div>
          <div className="flex items-center justify-between border-t border-b py-4">
            <div className="flex items-center gap-4 text-gray-600">
              <span>{blog.views} views</span>
            </div>
            <LikeButton blogId={blog.id} initialLikesCount={blog.likesCount} initialIsLiked={blog.isLiked} />
          </div>
        </article>
        <CommentSection blogId={blog.id} />
      </div>
    </div>
  );
};


// =================================================================
// MAIN APP COMPONENT
// =================================================================
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  const [pageState, setPageState] = useState({ name: 'landing', props: {} });
  
  useEffect(() => {
    if (!isAuthenticated) {
      setPageState({ name: 'landing', props: {} });
    }
  }, [isAuthenticated]);
  
  const navigate = (page, props = {}) => { 
    setPageState({ name: page, props });
    window.scrollTo(0, 0);
  };
  
  if (isAuthenticated && user) {
    if (pageState.name === 'blogDetail') {
      return <BlogDetail blogId={pageState.props.blogId} onNavigate={navigate} />;
    }
    return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard onNavigate={navigate} />;
  }

  const LandingPage = () => (
    <>
      <Header onNavigate={navigate} />
      <main>
        <HeroSection onNavigate={navigate} />
        <ShowcaseSection />
        <CTASection onNavigate={navigate} />
      </main>
      <Footer />
    </>
  );
  
  if (pageState.name === 'login') {
    return <LoginPage onLoginSuccess={() => navigate('dashboard')} />;
  }

  return <div className="bg-gray-50"><LandingPage /></div>;
};

export default App;