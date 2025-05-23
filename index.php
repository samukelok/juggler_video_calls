<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Juggler - Start a Video Call</title>
    <link rel="shortcut icon" href="./assets/img/juggler.png" type="image/x-icon">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #f8f9fa;
            font-family: 'Inter', sans-serif;
        }
        .hero-section {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            border-radius: 10px;
        }
        .join-form {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        /* Adjust On Big Screens: Laptops, TVs - It Must Not Scroll Vertically */
        @media (min-width: 992px) {
            body {
                overflow: hidden;
                height: 100vh;
            }

            h1{
                font-size: 2rem;
                margin-top: -40px;
            }

            #heroSection{
                margin-top: -40px !important;
            }
        }

        /* Adjust On Small Screens: Phones, Tablets - It Must Scroll Vertically */
        @media (max-width: 991px) {
            body {
                overflow: auto;
                height: auto;
            }

            h1{
                font-size: 1.5rem;
                margin-top: -20px;
            }

            #heroSection{
                margin-top: -20px !important;
            }
        }
        
    </style>
</head>
<body>
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-lg-8 text-center mb-5">
                <h1 class="display-4 mb-3">Juggler Video Calls</h1>
                <p class="lead">Simple, private video calls with anyone. No login required.</p>
            </div>
        </div>
        
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="p-5 hero-section mb-4" id="heroSection">
                    <h2 class="mb-4">Start or join a call</h2>
                    <div class="join-form p-4">
                        <div class="mb-3">
                            <label for="callId" class="form-label">Call ID</label>
                            <input type="text" class="form-control form-control-lg" id="callId" placeholder="Enter call ID or leave empty to create new">
                        </div>
                        <button id="joinCall" class="btn btn-primary btn-lg w-100">
                            Join Call
                        </button>
                    </div>
                </div>
                
                <div class="text-center text-muted">
                    <p>Share the call ID with others to invite them</p>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.getElementById('joinCall').addEventListener('click', () => {
            const callId = document.getElementById('callId').value.trim() || generateCallId();
            window.location.href = `call.php?call=${callId}`;
        });

        function generateCallId() {
            return Math.random().toString(36).substring(2, 8) + '-' + 
                   Math.random().toString(36).substring(2, 6);
        }
    </script>
</body>
</html>