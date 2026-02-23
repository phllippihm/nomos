/**
 * Nomos - Login Page Logic
 * Extracted from login.html inline script.
 */
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('password').value;
    const submitBtn = document.getElementById('submitBtn');
    const errorMsg = document.getElementById('error-message');

    submitBtn.innerHTML = 'Conectando...';
    submitBtn.disabled = true;
    errorMsg.classList.add('hidden');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, senha: senha })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            window.location.href = '/home';
        } else {
            errorMsg.classList.remove('hidden');
            submitBtn.innerHTML = 'Acessar Sistema';
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        errorMsg.classList.remove('hidden');
        errorMsg.innerText = 'Erro ao conectar. Tente novamente.';
        submitBtn.innerHTML = 'Acessar Sistema';
        submitBtn.disabled = false;
    }
});
