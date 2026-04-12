<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Download Your Memories | {{ config('app.name', 'Potopi') }}</title>
    <link rel="icon" href="{{ asset('images/logo.png') }}" type="image/png" sizes="any">
    <link rel="apple-touch-icon" href="{{ asset('images/logo.png') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        :root {
            --primary: #f59e0b;
            --primary-hover: #d97706;
            --bg-dark: #0f172a;
            --bg-card: rgba(30, 41, 59, 0.7);
            --text-main: #fcf8f1;
            --text-muted: #94a3b8;
            --glass-border: rgba(255, 255, 255, 0.1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Outfit', sans-serif;
        }

        body {
            background: radial-gradient(circle at top left, #2d1b0d 0%, #0f172a 100%);
            color: var(--text-main);
            min-height: 100vh;
            padding-bottom: 4rem;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }

        header {
            text-align: center;
            margin-bottom: 3rem;
            animation: fadeInDown 0.8s ease-out;
        }

        .brand-logo {
            display: block;
            margin: 0 auto 0.75rem;
            max-width: min(100%, 260px);
            width: auto;
            height: auto;
            object-fit: contain;
            object-position: center;
        }

        .subtitle {
            color: var(--text-muted);
            font-size: 1.1rem;
        }

        /* Hero Section */
        .hero-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 4rem;
        }

        @media (max-width: 768px) {
            .hero-section {
                grid-template-columns: 1fr;
            }
        }

        .card {
            background: var(--bg-card);
            backdrop-filter: blur(12px);
            border: 1px solid var(--glass-border);
            border-radius: 1.5rem;
            padding: 1.5rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            transition: transform 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .card-title {
            font-size: 1.25rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .media-preview {
            width: 100%;
            border-radius: 1rem;
            overflow: hidden;
            background: #000;
            aspect-ratio: 4 / 3;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
        }

        .media-preview img,
        .media-preview video {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .download-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            background: var(--primary);
            color: white;
            text-decoration: none;
            padding: 0.875rem 1.75rem;
            border-radius: 0.75rem;
            font-weight: 600;
            width: 100%;
            transition: all 0.2s ease;
            border: none;
            cursor: pointer;
        }

        .download-btn:hover {
            background: var(--primary-hover);
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
        }

        /* Gallery Section */
        .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1.5rem;
        }

        .gallery-item {
            position: relative;
            border-radius: 1rem;
            overflow: hidden;
            aspect-ratio: 1;
            border: 1px solid var(--glass-border);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            group-hover: scale(1.05);
            transition: all 0.3s ease;
        }

        .gallery-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
        }

        .gallery-item:hover img {
            transform: scale(1.1);
        }

        .overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.0);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: all 0.3s ease;
        }

        .gallery-item:hover .overlay {
            background: rgba(0, 0, 0, 0.4);
            opacity: 1;
        }

        .mini-download-btn {
            background: white;
            color: black;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            transition: transform 0.2s ease;
        }

        .mini-download-btn:hover {
            transform: scale(1.1);
        }

        footer {
            text-align: center;
            margin-top: 4rem;
            color: var(--text-muted);
            font-size: 0.875rem;
        }

        @keyframes fadeInDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <header>
            <img src="{{ asset('images/logo.png') }}" alt="Potopi Photobooth" class="brand-logo" decoding="async"
                fetchpriority="high">
            <p class="subtitle">Your memories from {{ $finalImage->transaction->machine->name ?? 'our booth' }} are
                ready!</p>
        </header>

        <div class="hero-section">
            <!-- Final Composite Card -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title"><i data-lucide="image"></i> Final Photo</h2>
                </div>
                <div class="media-preview">
                    @if ($finalImage->image_url)
                        <img src="{{ $finalImage->image_url }}" alt="Final Composite Photo">
                    @else
                        <p style="color: var(--text-muted)">Image Not Available</p>
                    @endif
                </div>
                <a href="{{ $finalImage->image_url }}" download="Roambooth_Photo_{{ $finalImage->token }}.jpg"
                    class="download-btn">
                    <i data-lucide="download"></i> Download Photo
                </a>
            </div>

            <!-- Live Photo Card -->
            @if ($finalImage->video_path)
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title"><i data-lucide="video"></i> Live Photo</h2>
                    </div>
                    <div class="media-preview">
                        <video src="{{ $finalImage->video_url }}" controls preload="metadata"></video>
                    </div>
                    <a href="{{ $finalImage->video_url }}" download="Roambooth_LivePhoto_{{ $finalImage->token }}.mp4"
                        class="download-btn">
                        <i data-lucide="download"></i> Download Video
                    </a>
                </div>
            @endif
        </div>

        @if ($finalImage->transaction->photos->count() > 0)
            <h2 class="section-title"><i data-lucide="camera"></i> Session Gallery</h2>
            <div class="gallery-grid">
                @foreach ($finalImage->transaction->photos as $index => $photo)
                    <div class="gallery-item">
                        <img src="{{ $photo->photo_url }}" alt="Session Photo {{ $index + 1 }}">
                        <div class="overlay">
                            <a href="{{ $photo->photo_url }}" download="Photo_{{ $index + 1 }}.jpg"
                                class="mini-download-btn">
                                <i data-lucide="download" size="20"></i>
                            </a>
                        </div>
                    </div>
                @endforeach
            </div>
        @endif

        <footer>
            <p>&copy; {{ date('Y') }} Potopi. All rights reserved.</p>
        </footer>
    </div>

    <script>
        lucide.createIcons();
    </script>
</body>

</html>
