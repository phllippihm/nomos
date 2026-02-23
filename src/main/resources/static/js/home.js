/**
 * Nomos - Home (Dashboard) Page Logic
 * Extracted from home.html inline script.
 */
document.getElementById('logout-button').addEventListener('click', async () => {
    if (confirm('Deseja realmente sair?')) {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            });
            if (response.ok) {
                localStorage.removeItem('token');
                window.location.replace('/login');
            } else {
                alert('Erro ao sair. Tente novamente.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Erro de conexão ao sair.');
        }
    }
});
