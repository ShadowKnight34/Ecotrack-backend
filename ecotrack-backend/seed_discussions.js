const pool = require('./config/db');

const discussionsData = [
    {
        userID: 10, // Ungga123
        title: "Tips on recycling plastic bottles",
        content: "Hey guys! Just wanted to share that washing your plastic bottles before recycling them makes a massive difference! Dirty plastics contaminate entire batches at the recycling facility.",
        category: "General Feed"
    },
    {
        userID: 27, // Ammar30
        title: "How does hydroelectric power work?",
        content: "Does anyone know the main environmental impact of building large hydroelectric dams in local river basins? Let's discuss KSSM Geografi concepts!",
        category: "Q&A Help"
    },
    {
        userID: 4, // ungga
        title: "Let's join the river cleanup!",
        content: "There's a local community cleanup project next Saturday. Who wants to join and earn some community service points?",
        category: "General Feed"
    },
    {
        userID: 6, // ungga123
        title: "Need help with KSSM Geografi SDG 12",
        content: "Can someone summarize the local relevance of SDG 12 (Sustainable Consumption) for our upcoming project? Appreciate it!",
        category: "Q&A Help"
    }
];

async function seed() {
    try {
        console.log('Seeding discussion posts...');
        for (let post of discussionsData) {
            await pool.query(
                'INSERT INTO Discussion (userID, title, content, sdgCategory) VALUES (?, ?, ?, ?)',
                [post.userID, post.title, post.content, post.category]
            );
        }
        console.log('Successfully seeded discussions!');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

seed();
