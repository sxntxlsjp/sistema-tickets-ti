/*
  MasterDiv Desk — Comportamiento compartido de modales (Fase 9 / 16)
  Todos los modales del sistema comparten el mismo patrón de marcado
  (overlay ".fixed.inset-0" + clase "hidden" para mostrar/ocultar),
  así que un único listener cubre ESC y click-fuera en toda la app
  sin duplicar lógica de cierre por página.
*/

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    document.querySelectorAll('.fixed.inset-0').forEach(overlay => {
        if (!overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
        }
    });
});

document.addEventListener('click', (event) => {
    if (!event.target.matches || !event.target.matches('.fixed.inset-0')) return;
    if (event.target.classList.contains('hidden')) return;

    event.target.classList.add('hidden');
});
