const mysql = require('mysql2/promise');

// Database configuration structure matching your local XAMPP environment
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Leave blank if default XAMPP configuration
    database: 'ecotrack_db'
};

const sdgData = [
    {
        id: 1,
        mission: "To end poverty in all its forms everywhere by ensuring everyone has access to basic resources, safety nets, and equal economic opportunities.",
        targets: "• Eradicating extreme poverty (people living on less than $2.15 a day).\n• Implementing social protection assistance systems.\n• Ensuring equal rights to economic resources and asset ownership.",
        local: "Aligns with Malaysia's ongoing efforts to eradicate hardcore poverty through targeted welfare assistance (STR), affordable housing program blocks (PPR), and rural infrastructure development."
    },
    {
        id: 2,
        mission: "End hunger, achieve food security, improve nutrition, and promote sustainable agriculture across global food supply networks.",
        targets: "• Ending malnutrition across vulnerable demographics.\n• Ensuring year-round access to safe, nutritious food.\n• Doubling small-scale agricultural productivity and sustainability metrics.",
        local: "Connects to local agricultural sustainability initiatives, food bank network expansions, and national food security guidelines managed by MARDI and local farming cooperatives."
    },
    {
        id: 3,
        mission: "Ensure healthy lives and promote well-being for all individuals at all ages by reducing mortality and preventing disease outbreaks.",
        targets: "• Reducing maternal and neonatal mortality indices.\n• Ending epidemics of communicable tropical diseases.\n• Strengthening mental health frameworks and substance abuse prevention.",
        local: "Aligns with the Ministry of Health (KKM) universal healthcare expansion, immunization campaigns in schools, and nationwide lifestyle disease prevention programs (Agenda Nasional Malaysia Sihat)."
    },
    {
        id: 4,
        mission: "Ensure inclusive, equitable quality education and promote lifelong learning opportunities for all youth.",
        targets: "• Providing free, equitable primary and secondary schooling.\n• Expanding technical, vocational (TVET), and digital skills training.\n• Upgrading school facilities for absolute safety.",
        local: "This is your current journey through the Malaysian KSSM secondary school system! It covers educational digitalization, TVET stream expansions, and equal school access via rural assistance plans like RMT."
    },
    {
        id: 5,
        mission: "Achieve gender equality and empower all women and girls by eliminating discrimination and structural barriers.",
        targets: "• Ending all forms of discrimination and violence against women.\n• Ensuring full and effective leadership participation.\n• Expanding equal economic and workplace rights.",
        local: "Reflects national targets for increasing women's representation in leadership positions, enforcing the Anti-Sexual Harassment Act, and supporting women-led business grants."
    },
    {
        id: 6,
        mission: "Ensure absolute availability and sustainable management of safe water and sanitation services for all global citizens.",
        targets: "• Achieving universal access to safe drinking water infrastructure.\n• Improving water quality by reducing pollution discharges.\n• Protecting and restoring wetland ecosystems.",
        local: "Maps closely to KSSM Geografi topics covering river basin management, protecting local water catchment zones, and major regional cleanup projects like the River of Life."
    },
    {
        id: 7,
        mission: "Ensure access to affordable, reliable, sustainable, and modern clean energy alternatives for everyone.",
        targets: "• Substantially increasing the share of global renewable energy.\n• Doubling the global rate of improvement in energy efficiency layers.",
        local: "Heavily linked to national green energy shifts including large-scale solar (LSS) farms, Sarawak's hydroelectric grid networks, and the National Energy Transition Roadmap (NETR)."
    },
    {
        id: 8,
        mission: "Promote sustained, inclusive economic growth, full and productive employment, and decent work environments for all.",
        targets: "• Sustaining per capita economic growth trends.\n• Achieving full productive employment arrays.\n• Eradicating forced labor and securing safe working conditions.",
        local: "Focuses on generating high-value digital tech careers for youth, supporting SME businesses, and advancing labor welfare protection policies."
    },
    {
        id: 9,
        mission: "Build resilient infrastructure, promote inclusive and sustainable industrialization, and foster technological innovation.",
        targets: "• Upgrading infrastructure with clean, eco-friendly technologies.\n• Enhancing scientific research data capability.\n• Boosting industrial digitalization capabilities.",
        local: "Directly mirrors smart city blueprints, MyDigital framework goals, and switching local manufacturing corridors toward automated IR 4.0 standards."
    },
    {
        id: 10,
        mission: "Reduce inequality within and among nations by ensuring fair resource distribution and progressive social legislation.",
        targets: "• Progressively achieving income growth for the bottom 40% (B40).\n• Eliminating discriminatory laws.\n• Improving institutional migration policies.",
        local: "Ties directly to income redistribution programs supporting B40 cohorts, providing equal educational opportunities, and shrinking urban-rural developmental gaps."
    },
    {
        id: 11,
        mission: "Make cities and human settlements inclusive, safe, resilient, and environmentally sustainable.",
        targets: "• Ensuring access to safe, affordable housing options.\n• Expanding affordable public transport networks.\n• Reducing the per capita environmental impact of municipal waste.",
        local: "Connects to green urban mobility expansions (LRT/MRT links), municipal recycling mandates, and urban flood defense structures like Kuala Lumpur's SMART Tunnel."
    },
    {
        id: 12,
        mission: "Ensure sustainable consumption and production patterns by minimizing material footprints and chemical resource waste.",
        targets: "• Halving per capita global food waste numbers.\n• Achieving environmentally sound management of hazardous wastes.\n• Promoting corporate sustainability reporting standard compliance.",
        local: "Aligns with local zero-single-use-plastic roadmaps, municipal electronic waste (e-waste) collection frameworks, and circular economy patterns in retail manufacturing."
    },
    {
        id: 13,
        mission: "Take urgent action to combat climate change and its compounding ecological and economic impacts worldwide.",
        targets: "• Strengthening resilience and adaptive capacity to climate disasters.\n• Integrating climate strategies into national policy frameworks.",
        local: "Focuses on domestic disaster preparedness for monsoon flash flooding, expanding urban forest sanctuaries, and building out carbon tax legislation."
    },
    {
        id: 14,
        mission: "Conserve and sustainably use the oceans, seas, and marine resources to safeguard global aquatic biodiversity.",
        targets: "• Preventing and significantly reducing marine pollution debris.\n• Regulating fishing harvests to completely end overfishing.\n• Conserving sensitive coastal ecosystem zones.",
        local: "Covers marine park sanctuary preservation zones in Sabah/Terengganu, mangrove reforestation along coastlines, and combating plastic run-offs into the Straits of Malacca."
    },
    {
        id: 15,
        mission: "Protect, restore, and promote sustainable use of terrestrial ecosystems, manage forests sustainably, and halt biodiversity loss.",
        targets: "• Combating desertification and restoring degraded land blocks.\n• Halting poaching and illegal trafficking of protected wildlife species.",
        local: "Maps to core KSSM environmental conservation topics: protecting local tropical rainforests, enforcing wildlife laws via the Wildlife Conservation Act, and protecting endangered native species like the Malayan Tiger."
    },
    {
        id: 16,
        mission: "Promote peaceful and inclusive societies, provide access to justice for all, and build effective, accountable public institutions.",
        targets: "• Significantly reducing all forms of violence indices.\n• Substantially reducing corruption, bribery, and institutional financial leaks.\n• Ensuring transparent legal enforcement platforms.",
        local: "Ties directly to governance transparency standards, digitalizing public access to legal registries, and expanding community mediation programs."
    },
    {
        id: 17,
        mission: "Strengthen the means of implementation and revitalize the global partnership for sustainable development through shared technical telemetry.",
        targets: "• Enhancing global macroeconomic stability channels.\n• Promoting cross-border green technology transfers.\n• Building systemic statistical monitoring frameworks.",
        local: "Explores how public agencies (like TNB), private industries, and university platforms (like UNITEN) collaborate on sustainability innovations, green technology financing, and community-driven impact metrics."
    }
];

async function seedDatabase() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to ecotrack_db successfully.');

    try {
        for (const row of sdgData) {
            const query = `
        UPDATE module 
        SET coreMission = ?, keyTargets = ?, localRelevance = ? 
        WHERE moduleID = ?
      `;
            await connection.execute(query, [row.mission, row.targets, row.local, row.id]);
        }
        console.log('✅ All 17 SDG educational briefings have been seeded into the database successfully!');
    } catch (error) {
        console.error('❌ Error during seeding transaction:', error);
    } finally {
        await connection.end();
    }
}

seedDatabase();