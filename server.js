const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use(session({
    secret: 'boxify_secret_key_9988',
    resave: false,
    saveUninitialized: false
}));

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://cluster0.example:password@cluster.mongodb.net/boxify?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('DB Error:', err));

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 }
});
const User = mongoose.model('User', userSchema);

const depositSchema = new mongoose.Schema({
    userId: String,
    username: String,
    amount: Number,
    status: { type: String, default: 'Pending' }
});
const Deposit = mongoose.model('Deposit', depositSchema);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/signin', async (req, res) => {
    const { emailOrUsername, password } = req.body;
    if (emailOrUsername === 'dr' && password === 'dras123j@88') {
        req.session.user = { isAdmin: true, username: 'Admin' };
        return res.redirect('/admin');
    }
    const user = await User.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    password
});

    if (!user) return res.send('Invalid credentials. <a href="/">Back</a>');
    req.session.user = user;
    res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(`<h1>Welcome ${req.session.user.username}</h1><a href="/logout">Logout</a>`);
});

app.get('/admin', (req, res) => {
    if (!req.session.user || !req.session.user.isAdmin) return res.redirect('/');
    res.send('<h1>Admin Panel</h1><a href="/logout">Logout</a>');
});

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
