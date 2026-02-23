/**
 * Nomos - Sidebar Toggle Logic
 * Extracted from fragments/sidebar.html inline script.
 */
(function () {
    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');
    if (!sidebar || !toggleSidebar) return;

    const toggleIcon = toggleSidebar.querySelector('span');
    const sidebarTexts = document.querySelectorAll('.sidebar-text');
    let isCollapsed = false;

    function updateSidebarState() {
        if (isCollapsed) {
            sidebar.classList.remove('w-64');
            sidebar.classList.add('w-[88px]');
            toggleIcon.innerText = 'chevron_right';
            toggleSidebar.setAttribute('aria-expanded', 'false');
            toggleSidebar.setAttribute('aria-label', 'Expandir Menu Lateral');
            sidebarTexts.forEach(text => {
                text.classList.add('opacity-0', 'pointer-events-none');
            });
        } else {
            sidebar.classList.remove('w-[88px]');
            sidebar.classList.add('w-64');
            toggleIcon.innerText = 'chevron_left';
            toggleSidebar.setAttribute('aria-expanded', 'true');
            toggleSidebar.setAttribute('aria-label', 'Recolher Menu Lateral');
            sidebarTexts.forEach(text => {
                text.classList.remove('opacity-0', 'pointer-events-none');
            });
        }
    }

    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
        isCollapsed = true;
        updateSidebarState();
    }

    toggleSidebar.addEventListener('click', () => {
        isCollapsed = !isCollapsed;
        localStorage.setItem('sidebarCollapsed', isCollapsed);
        updateSidebarState();
    });
})();
