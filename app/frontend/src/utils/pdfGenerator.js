// Arquivo: c:\Users\sneto\PosturePal\app\frontend\src\utils\pdfGenerator.js
// Gerador de relatório em PDF para a aplicação móvel PosturePal

import jsPDF from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Cache simples para evitar carregar a fonte mais de uma vez
let __pdfFontLoaded = false;

// Converte ArrayBuffer para base64 em blocos (evita limites de stack)
const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
};

// Tenta carregar a fonte Inter (Regular/Bold) de /fonts (pasta public). Se não achar, usa Helvetica.
const ensureInterFont = async (doc) => {
  if (__pdfFontLoaded) return;
  try {
    const [regRes, boldRes] = await Promise.all([
      fetch('/fonts/Inter-Regular.ttf'),
      fetch('/fonts/Inter-Bold.ttf')
    ]);
    if (!regRes.ok || !boldRes.ok) throw new Error('Font files not found');

    const [regBuf, boldBuf] = await Promise.all([regRes.arrayBuffer(), boldRes.arrayBuffer()]);

    const reg64 = bufferToBase64(regBuf);
    const bold64 = bufferToBase64(boldBuf);

    doc.addFileToVFS('Inter-Regular.ttf', reg64);
    doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');

    doc.addFileToVFS('Inter-Bold.ttf', bold64);
    doc.addFont('Inter-Bold.ttf', 'Inter', 'bold');

    __pdfFontLoaded = true;
  } catch (e) {
    // Mantém Helvetica como fallback
    __pdfFontLoaded = false;
  }
};

/**
 * Gera um relatório em PDF com dados da sessão de exercício
 * @param {Object} sessionData - Dados da sessão incluindo exercício, histórico de scores e feedbacks
 */
export const generatePDFReport = async (sessionData) => {
  const { exercise, scoreHistory, average, topFeedbacks, date } = sessionData;

  // Normaliza dados para evitar erros de undefined
  const safeTopFeedbacks = {
    success: Array.isArray(topFeedbacks?.success) ? topFeedbacks.success : [],
    error: Array.isArray(topFeedbacks?.error) ? topFeedbacks.error : []
  };
  const exName = (exercise && exercise.name) ? exercise.name : 'Exercicio';

  // Cria um novo documento PDF (tamanho A4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Tenta aplicar fonte Inter (se estiver disponível em /public/fonts)
  await ensureInterFont(doc);
  if (__pdfFontLoaded) {
    doc.setFont('Inter', 'normal');
  } else {
    doc.setFont('helvetica', 'normal');
  }
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Separador sutil entre seções
  const divider = (offset = 12) => {
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition + offset, pageWidth - margin, yPosition + offset);
  };

  // Card com sombra sutil
  const drawCard = (x, y, width, height, fillColor = [255, 255, 255]) => {
    // Sombra
    doc.setFillColor(0, 0, 0);
    doc.setGState(new doc.GState({ opacity: 0.05 }));
    doc.roundedRect(x + 1, y + 1, width, height, 2, 2, 'F');
    doc.setGState(new doc.GState({ opacity: 1 }));
    // Card
    doc.setFillColor(...fillColor);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, width, height, 2, 2, 'FD');
  };

  // Ícone de check (círculo com check)
  const drawCheckIcon = (x, y, size = 3) => {
    doc.setFillColor(34, 197, 94); // green-500
    doc.circle(x, y, size, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(x - 1.2, y, x - 0.3, y + 1.2);
    doc.line(x - 0.3, y + 1.2, x + 1.5, y - 1.2);
  };

  // Ícone de alerta (triângulo com !)
  const drawAlertIcon = (x, y, size = 3) => {
    doc.setFillColor(245, 158, 11); // amber-500
    doc.triangle(x, y - size, x - size * 0.866, y + size * 0.5, x + size * 0.866, y + size * 0.5, 'F');
    doc.setFillColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'bold');
    doc.text('!', x, y + 1, { align: 'center' });
  };

  // Função para sanitizar texto (preserva acentos/ç; remove apenas caracteres fora de Latin-1)
  const sanitize = (text) => {
    if (!text) return '';
    try {
      return String(text)
        // mantém acentos (não remove diacríticos)
        .replace(/[^\x00-\xFF]/g, ''); // remove caracteres fora do Latin-1 (emojis etc.)
    } catch {
      return String(text);
    }
  };

  // Função auxiliar para adicionar texto com quebra de linha automática
  const addText = (text, fontSize, isBold = false, color = [0, 0, 0]) => {
    const safe = sanitize(text);
    doc.setFontSize(fontSize);
    doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(safe, contentWidth);
    doc.text(lines, margin, yPosition);
    yPosition += (lines.length * fontSize * 0.5) + 5;
  };

  // Função auxiliar para verificar se é necessário adicionar uma nova página
  const checkPageBreak = (requiredSpace = 40) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };
  // Cabeçalho com efeito de gradiente suave (simulado com múltiplos retângulos)
  const headerHeight = 35;
  const gradientSteps = 20;
  const stepWidth = pageWidth / gradientSteps;
  
  // Gradiente rosa para roxo
  for (let i = 0; i < gradientSteps; i++) {
    const ratio = i / gradientSteps;
    // Interpolação de cor: rosa [244, 63, 94] → roxo [168, 85, 247]
    const r = Math.round(244 - (244 - 168) * ratio);
    const g = Math.round(63 + (85 - 63) * ratio);
    const b = Math.round(94 + (247 - 94) * ratio);
      doc.setFillColor(r, g, b);
    doc.rect(i * stepWidth, 0, stepWidth + 1, headerHeight, 'F');
  }
  // Format report date
  const reportDate = new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Report title
  doc.setFontSize(22);
  doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('PosturePal', margin, 18);
  
  doc.setFontSize(12);
  doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'normal');
  doc.text('Session Report', margin, 28);
  yPosition = 42;

  // Report date card
  drawCard(margin, yPosition, contentWidth, 12, [249, 250, 251]);
  doc.setFontSize(9);
  doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated on: ${reportDate}`, margin + 5, yPosition + 7.5);
  yPosition += 18;

  // Exercise name card
  drawCard(margin, yPosition, contentWidth, 20, [249, 250, 251]);
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.circle(margin + 8, yPosition + 10, 3, 'F');
  doc.setFontSize(14);
  doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Exercise: ${exName}`, margin + 15, yPosition + 12);
  yPosition += 28;

  // Overall performance section
  addText('Overall Performance', 16, true, [30, 41, 59]);
  yPosition += 5;

  // Círculo do score
  const scoreColor = obterCorDoScore(average);
  doc.setFillColor(...scoreColor);
  doc.circle(pageWidth / 2, yPosition + 18, 22, 'F');
    doc.setFontSize(28);
  doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const averageDisplay = Number(average || 0).toFixed(1);
  doc.text(averageDisplay, pageWidth / 2, yPosition + 21, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'bold');
  doc.text('/ 100', pageWidth / 2, yPosition + 29, { align: 'center' });
  
  yPosition += 55;
  divider(6);

  // Badge de desempenho
  const badge = obterTextoDoScore(average);
  doc.setFillColor(...obterCorDoBadge(average));
  const badgeWidth = contentWidth * 0.7;
  doc.roundedRect(pageWidth / 2 - badgeWidth / 2, yPosition, badgeWidth, 14, 3, 3, 'F');
  doc.setFontSize(11);
  doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(badge, pageWidth / 2, yPosition + 9, { align: 'center' });
  yPosition += 22;
  divider(10);
  // Check page break before strengths section
  checkPageBreak(50);
  // Section: Strengths
  if (safeTopFeedbacks.success.length > 0) {
    // Section header with icon and elegant title
    drawCheckIcon(margin + 3, yPosition + 10, 2.5);
    doc.setFontSize(15);
    doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('Strengths', margin + 10, yPosition + 12);
    yPosition += 20;

    // Card com feedbacks
    drawCard(margin, yPosition, contentWidth, Math.max(25, safeTopFeedbacks.success.length * 11 + 8), [236, 253, 245]);
    yPosition += 6;

    safeTopFeedbacks.success.forEach((item) => {
      checkPageBreak(12);
      doc.setFontSize(10);
      doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'normal');
      // marcador circular verde
      doc.setFillColor(5, 150, 105);
      doc.circle(margin + 6, yPosition - 1.5, 1.2, 'F');

      const safeText = sanitize(item.message);
      doc.setTextColor(30, 41, 59);
      const textLines = doc.splitTextToSize(safeText, contentWidth - 16);
      doc.text(textLines, margin + 11, yPosition);
      yPosition += textLines.length * 4 + 2;
    });    yPosition += 15;
  }
  // Check page break before improvements section
  checkPageBreak(50);

  // Section: Areas for Improvement
  if (safeTopFeedbacks.error.length > 0) {
    // Section header with icon and elegant title
    drawAlertIcon(margin + 3, yPosition + 10, 2.5);
    doc.setFontSize(15);
    doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    doc.text('Areas for Improvement', margin + 10, yPosition + 12);
    yPosition += 20;

    // Card com feedbacks
    drawCard(margin, yPosition, contentWidth, Math.max(25, safeTopFeedbacks.error.length * 11 + 8), [255, 251, 235]);
    yPosition += 6;

    safeTopFeedbacks.error.forEach((item) => {
      checkPageBreak(12);
      doc.setFontSize(10);
      doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'normal');
      // marcador quadrado laranja
      doc.setFillColor(217, 119, 6);
      doc.rect(margin + 5, yPosition - 3, 2.4, 2.4, 'F');
      
      const safeText = sanitize(item.message);
      doc.setTextColor(30, 41, 59);
      const textLines = doc.splitTextToSize(safeText, contentWidth - 16);
      doc.text(textLines, margin + 11, yPosition);
      yPosition += textLines.length * 4 + 2;
    });

    yPosition += 15;
  }
  // Score progression history
  if (scoreHistory && scoreHistory.length > 1) {
    checkPageBreak(60);
    
    // Section header
    doc.setFontSize(13);
    doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Score Progression', margin, yPosition + 10);
    yPosition += 18;

    // Card com gráfico
    const graphHeight = 45;
    drawCard(margin, yPosition, contentWidth, graphHeight, [249, 250, 251]);
    
    const ultimosScores = scoreHistory.slice(-10);
    const maxScore = 100;
    const minScore = 0;
    const graphWidth = contentWidth - 20;
    const graphAreaHeight = 30;
    const startX = margin + 10;
    const startY = yPosition + graphHeight - 10;
    const barWidth = graphWidth / ultimosScores.length;

    // Desenha o gráfico de barras
    ultimosScores.forEach((score, idx) => {
      const barHeight = (score / maxScore) * graphAreaHeight;
      const x = startX + (idx * barWidth);
      const y = startY - barHeight;
      
      // Barra
      const barColor = obterCorDoScore(score);
      doc.setFillColor(...barColor);
      doc.setGState(new doc.GState({ opacity: 0.8 }));
      doc.roundedRect(x + 1, y, barWidth - 2, barHeight, 1, 1, 'F');
      doc.setGState(new doc.GState({ opacity: 1 }));
      
      // Label do score
      doc.setFontSize(7);
      doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(String(score), x + barWidth / 2, y - 2, { align: 'center' });
    });

    // Linha base
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(startX, startY, startX + graphWidth, startY);

    // Estatísticas adicionais
    yPosition += graphHeight + 8;
    const stats = {
      min: Math.min(...ultimosScores),
      max: Math.max(...ultimosScores),
      avg: (ultimosScores.reduce((a, b) => a + b, 0) / ultimosScores.length).toFixed(1)
    };    doc.setFontSize(8);
    doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`Min: ${stats.min}  |  Max: ${stats.max}  |  Avg: ${stats.avg}`, margin + 10, yPosition);
    yPosition += 8;
  }

  divider(8);

  // Motivational footer
  const footerY = pageHeight - 12;
  doc.setFontSize(7);
  doc.setFont(__pdfFontLoaded ? 'Inter' : 'helvetica', 'italic');
  doc.setTextColor(156, 163, 175);
  doc.text('Keep practicing to improve your posture!', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Generated by PosturePal - Your Personal Posture Coach', pageWidth / 2, footerY + 4, { align: 'center' });
  
  // Nome do arquivo
  const fileName = `PosturePal_${exName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_\- ]/g, '')
    .replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  if (Capacitor.isNativePlatform()) {
    try {
      const pdfBuffer = doc.output('arraybuffer');
      const pdfData = bufferToBase64(pdfBuffer);
      let result = await Filesystem.writeFile({
        path: fileName,
        data: pdfData,
        directory: Directory.Documents,
        recursive: true,
      });

      if (!result || !result.uri) {
        result = await Filesystem.writeFile({
          path: fileName,
          data: pdfData,
          directory: Directory.ExternalStorage,
          recursive: true,
        });
      }

      console.log('PDF salvo em:', result.uri);
      return { success: true, uri: result.uri };
    } catch (error) {
      try {
        const pdfBuffer = doc.output('arraybuffer');
        const pdfData = bufferToBase64(pdfBuffer);
        const result = await Filesystem.writeFile({
          path: fileName,
          data: pdfData,
          directory: Directory.ExternalStorage,
          recursive: true,
        });
        console.log('PDF salvo (fallback) em:', result.uri);
        return { success: true, uri: result.uri };
      } catch (e2) {
        console.error('Erro ao salvar PDF no dispositivo móvel:', error, e2);
        throw new Error('Falha ao salvar PDF: ' + (e2?.message || error?.message));
      }
    }
  }

  // Ambiente web: download direto
  doc.save(fileName);
  return { success: true, uri: fileName };
};

/**
 * Obtém a cor RGB do score para exibição no círculo
 * @param {number} score - Pontuação de 0 a 100
 * @returns {Array} Valores RGB [R, G, B]
 */
const obterCorDoScore = (score) => {
  if (score >= 95) return [74, 222, 128]; // verde-400
  if (score >= 85) return [163, 230, 53]; // limao-400
  if (score >= 75) return [96, 165, 250]; // azul-400
  if (score >= 65) return [250, 204, 21]; // amarelo-400
  if (score >= 50) return [251, 146, 60]; // laranja-400
  return [251, 113, 133]; // rosa-400
};

/**
 * Get badge text based on score
 * @param {number} score - Score from 0 to 100
 * @returns {string} Motivational message
 */
const obterTextoDoScore = (score) => {
  if (score >= 95) return 'Perfect Execution!';
  if (score >= 85) return 'Excellent Work!';
  if (score >= 75) return 'Great Job!';
  if (score >= 65) return 'Good Effort!';
  if (score >= 50) return 'You Can Improve!';
  return 'Keep Practicing!';
};

/**
 * Obtém a cor RGB do badge baseada no score
 * @param {number} score - Pontuação de 0 a 100
 * @returns {Array} Valores RGB [R, G, B]
 */
const obterCorDoBadge = (score) => {
  if (score >= 95) return [209, 250, 229]; // esmeralda-100
  if (score >= 85) return [236, 252, 203]; // limao-100
  if (score >= 75) return [219, 234, 254]; // azul-100
  if (score >= 65) return [254, 249, 195]; // amarelo-100
  if (score >= 50) return [255, 237, 213]; // laranja-100
  return [255, 228, 230]; // rosa-100
};
