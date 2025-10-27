export function getTopFeedbacks(feedbacks) {
  if (!Array.isArray(feedbacks)) return { success: [], error: [] };

  // separa por tipo
  const successFeedbacks = feedbacks.filter(f => f.type === 'success');
  const errorFeedbacks = feedbacks.filter(f => f.type === 'error');

  // função para contar ocorrências e ordenar
  const countOccurrences = (arr) => {
    const map = {};
    arr.forEach(fb => {
      map[fb.message] = (map[fb.message] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1]) // ordena por frequência decrescente
      .slice(0, 3)                 // pega os 3 primeiros
      .map(([message, count]) => ({ message, count }));
  };

  return {
    success: countOccurrences(successFeedbacks),
    error: countOccurrences(errorFeedbacks),
  };
}