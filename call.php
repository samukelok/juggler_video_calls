<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Juggler Video Call</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="shortcut icon" href="./assets/img/juggler.png" type="image/x-icon">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <link href="assets/css/style.css" rel="stylesheet">
</head>
<body>
    <div id="app-container">
        <!-- Header -->
        <header class="bg-white shadow-sm">
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center py-2">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-camera-video-fill fs-4 text-primary me-2"></i>
                        <h1 class="h5 mb-0 text-dark">Juggler</h1>
                        <span class="badge bg-secondary ms-2" id="callIdBadge"></span>
                    </div>
                    <div class="d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-secondary me-2" id="copyLink">
                            <i class="bi bi-link-45deg"></i> Copy Link
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" id="participantCount">
                            <i class="bi bi-people-fill"></i> <span id="participantNumber">1</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main id="main-content">
            <div id="video-grid"></div>
        </main>

        <!-- Controls -->
        <footer class="bg-white border-top">
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center py-2 px-3">
                    <div class="d-flex gap-2">
                        <button class="control-btn" id="toggleMic">
                            <i class="bi bi-mic-fill fs-5"></i>
                        </button>
                        <button class="control-btn" id="toggleVideo">
                            <i class="bi bi-camera-video-fill fs-5"></i>
                        </button>
                        
                    </div>
                    
                    <div>
                        <button class="control-btn end-call" id="endCall">
                            <i class="bi bi-telephone-fill fs-5"></i>
                        </button>
                    </div>
                    
                    <div class="d-flex gap-2">
                        <button class="control-btn" id="shareScreen">
                            <i class="bi bi-share fs-5"></i>
                        </button>
                        <button class="control-btn" id="moreOptions">
                            <i class="bi bi-three-dots fs-5"></i>
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    </div>

    <!-- Modal for call ended -->
    <div class="modal fade" id="callEndedModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-body text-center p-4">
                    <i class="bi bi-telephone-x fs-1 text-danger mb-3"></i>
                    <h5 class="mb-3">Call Ended</h5>
                    <p>The video call has ended for all participants.</p>
                    <a href="index.php" class="btn btn-primary">Return to Home</a>
                </div>
            </div>
        </div>
    </div>

    <!-- Socket.io and Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script
        src="https://cdn.socket.io/4.7.2/socket.io.min.js"
        integrity="sha384-mZLF4UVrpi/QTWPA7BjNPEnkIfRFn4ZEO3Qt/HFklTJBj/gBOV8G3HcKn4NfQblz"
        crossorigin="anonymous">
    </script>

    <!-- Custom JS -->
    <script src="assets/js/call.js"></script>
</body>
</html>