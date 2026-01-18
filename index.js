
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WaveToGo - Prenotazione</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        /* --- 1. CONFIGURAZIONE VARIABILI & COLORI --- */
        :root {
            --primary-dark: #0a1e3b;
            --accent-orange: #F5A623;
            --bg-solid: #E8EEF4;
            --white: #FFFFFF;
            --text-main: #333333;
            --text-light: #888888;
            --radius: 16px;
            --shadow: 0 8px 24px rgba(0,0,0,0.08);
            --transition: all 0.3s ease;
        }

        /* --- 2. RESET & LAYOUT GENERALE --- */
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

        body {
            font-family: 'Montserrat', sans-serif;
            background-color: var(--bg-solid);
            color: var(--text-main);
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* --- 3. HEADER & MENU LINGUE --- */
        .app-header {
            background-color: var(--primary-dark);
            color: var(--white);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 100;
        }

        .lang-selector { position: relative; display: inline-block; }
        .header-icon { font-size: 1.2rem; cursor: pointer; }

        .lang-dropdown {
            display: none;
            position: absolute;
            right: 0;
            top: 40px;
            background-color: var(--white);
            min-width: 160px;
            box-shadow: var(--shadow);
            border-radius: 12px;
            z-index: 1001;
            overflow: hidden;
            border: 1px solid rgba(0,0,0,0.1);
        }
                                
