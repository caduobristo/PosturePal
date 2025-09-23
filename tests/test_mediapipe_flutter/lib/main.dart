// lib/main.dart
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

late List<CameraDescription> cameras;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  cameras = await availableCameras();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: PoseCamera(),
    );
  }
}

class PoseCamera extends StatefulWidget {
  const PoseCamera({super.key});
  @override
  State<PoseCamera> createState() => _PoseCameraState();
}

class _PoseCameraState extends State<PoseCamera> {
  CameraController? _controller;
  CameraDescription? _cameraDesc;
  late PoseDetector _poseDetector;

  // latest landmarks as a map (keyed by PoseLandmarkType)
  Map<PoseLandmarkType, PoseLandmark> _landmarks = {};
  Size? _imageSize; // size of the raw camera image (from CameraImage)
  int _rotationDeg = 0;
  bool _isFront = false;

  bool _isBusy = false;

  @override
  void initState() {
    super.initState();
    _poseDetector = PoseDetector(options: PoseDetectorOptions());
    _initCamera();
  }

  Future<void> _initCamera() async {
    // choose front camera if available
    _cameraDesc = cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.front,
      orElse: () => cameras.first,
    );

    _isFront = _cameraDesc!.lensDirection == CameraLensDirection.front;
    _rotationDeg = _cameraDesc!.sensorOrientation;

    _controller = CameraController(
      _cameraDesc!,
      ResolutionPreset.low,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.yuv420,
    );

    try {
      await _controller!.initialize();
    } catch (e) {
      debugPrint('Erro inicializando câmera: $e');
      return;
    }
    if (!mounted) return;
    setState(() {});

    // start stream
    await _controller!.startImageStream(_processCameraImage);
  }

  // concat planes robustly
  Uint8List _concatenatePlanes(List<Plane> planes) {
    final total = planes.fold<int>(0, (t, p) => t + p.bytes.length);
    final bytes = Uint8List(total);
    var offset = 0;
    for (final p in planes) {
      bytes.setRange(offset, offset + p.bytes.length, p.bytes);
      offset += p.bytes.length;
    }
    return bytes;
  }

  Future<void> _processCameraImage(CameraImage image) async {
    if (_isBusy) return;

    _isBusy = true;
    try {
      final bytes = _concatenatePlanes(image.planes);

      final Size imageSize = Size(
        image.width.toDouble(),
        image.height.toDouble(),
      );

      // Usa a rotação correta da câmera
      final rotation =
          InputImageRotationValue.fromRawValue(
            _cameraDesc!.sensorOrientation,
          ) ??
          InputImageRotation.rotation0deg;

      final format =
          InputImageFormatValue.fromRawValue(image.format.raw) ??
          InputImageFormat.nv21;

      final inputImage = InputImage.fromBytes(
        bytes: bytes,
        metadata: InputImageMetadata(
          size: imageSize,
          rotation: rotation,
          format: format,
          bytesPerRow: image.planes[0].bytesPerRow,
        ),
      );

      final poses = await _poseDetector.processImage(inputImage);

      if (poses.isNotEmpty) {
        // save map and image size for painter (one setState update)
        if (mounted) {
          setState(() {
            _landmarks = poses.first.landmarks;
            _imageSize = imageSize;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _landmarks = {};
            _imageSize = imageSize;
          });
        }
      }
    } catch (e, st) {
      debugPrint('Erro ao processar frame: $e\n$st');
    } finally {
      _isBusy = false;
    }
  }

  @override
  void dispose() {
    _controller?.stopImageStream();
    _controller?.dispose();
    _poseDetector.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_controller == null || !_controller!.value.isInitialized) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: LayoutBuilder(
        builder: (context, constraints) {
          // Calcula o tamanho máximo da câmera sem cortar
          final screenWidth = constraints.maxWidth;
          final screenHeight = constraints.maxHeight;
          final cameraAspectRatio =
              _controller!.value.previewSize!.height /
              _controller!.value.previewSize!.width;

          double cameraWidth, cameraHeight, cameraX, cameraY;

          // Calcula o tamanho máximo mantendo proporção
          if (screenWidth / screenHeight > cameraAspectRatio) {
            // Tela é mais larga - câmera ocupa altura total
            cameraHeight = screenHeight;
            cameraWidth = cameraHeight * cameraAspectRatio;
            cameraX = (screenWidth - cameraWidth) / 2;
            cameraY = 0;
          } else {
            // Tela é mais alta - câmera ocupa largura total
            cameraWidth = screenWidth;
            cameraHeight = cameraWidth / cameraAspectRatio;
            cameraX = 0;
            cameraY = (screenHeight - cameraHeight) / 2;
          }

          return Stack(
            fit: StackFit.expand,
            children: [
              // Câmera posicionada e dimensionada manualmente
              Positioned(
                left: cameraX,
                top: cameraY,
                width: cameraWidth,
                height: cameraHeight,
                child: CameraPreview(_controller!),
              ),
              // Overlay com landmarks
              if (_imageSize != null)
                CustomPaint(
                  size: Size(screenWidth, screenHeight),
                  painter: PosePainter(
                    landmarks: _landmarks,
                    imageSize: _imageSize!,
                    rotationDeg: _rotationDeg,
                    mirror: _isFront,
                    previewSize: _controller!.value.previewSize!,
                    cameraRect: Rect.fromLTWH(
                      cameraX,
                      cameraY,
                      cameraWidth,
                      cameraHeight,
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class PosePainter extends CustomPainter {
  final Map<PoseLandmarkType, PoseLandmark> landmarks;
  final Size imageSize;
  final bool mirror;
  final int rotationDeg;
  final Size previewSize;
  final Rect cameraRect;

  PosePainter({
    required this.landmarks,
    required this.imageSize,
    required this.mirror,
    required this.rotationDeg,
    required this.previewSize,
    required this.cameraRect,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.green
      ..strokeWidth = 4
      ..style = PaintingStyle.fill;

    // Calcula a proporção correta considerando a orientação da câmera
    final imageAspectRatio = imageSize.width / imageSize.height;
    final cameraAspectRatio = cameraRect.width / cameraRect.height;

    // Desenha todos os landmarks
    for (final lm in landmarks.values) {
      // As coordenadas dos landmarks estão em pixels da imagem original
      double x = lm.x;
      double y = lm.y;

      // Normaliza as coordenadas para [0,1] usando o tamanho da imagem
      x = x / imageSize.width;
      y = y / imageSize.height;

      // Para câmera frontal, espelha horizontalmente
      if (mirror) {
        x = 1.0 - x;
      }

      // Ajusta a proporção para evitar esticamento
      double canvasX, canvasY;

      if (imageAspectRatio > cameraAspectRatio) {
        // A imagem é mais larga que a área da câmera
        // Ajusta Y para manter proporção
        final scale =
            cameraRect.width /
            (imageSize.width * cameraRect.height / imageSize.height);
        canvasX = cameraRect.left + (x * cameraRect.width);
        canvasY =
            cameraRect.top +
            (y * cameraRect.height * scale) +
            (cameraRect.height - cameraRect.height * scale) / 2;
      } else {
        // A imagem é mais alta que a área da câmera
        // Ajusta X para manter proporção
        final scale =
            cameraRect.height /
            (imageSize.height * cameraRect.width / imageSize.width);
        canvasX =
            cameraRect.left +
            (x * cameraRect.width * scale) +
            (cameraRect.width - cameraRect.width * scale) / 2;
        canvasY = cameraRect.top + (y * cameraRect.height);
      }

      // Desenha o landmark
      canvas.drawCircle(Offset(canvasX, canvasY), 6, paint);
    }
  }

  @override
  bool shouldRepaint(covariant PosePainter oldDelegate) {
    return oldDelegate.landmarks != landmarks;
  }
}

// small math helper (avoid importing dart:math just for max)
double mathMax(double a, double b) => a > b ? a : b;
