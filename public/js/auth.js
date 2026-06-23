const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                errorMessage.textContent = data.message || 'No se pudo iniciar sesión';
                errorMessage.classList.remove('hidden');
                return;
            }

            setToken(data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (data.user.role === 'ADMIN') {
                window.location.href = 'dashboard.html';
                } else {
                 window.location.href = 'user-home.html';
                }

        } catch (error) {
            errorMessage.textContent = 'No se pudo conectar con el servidor';
            errorMessage.classList.remove('hidden');
        }
    });
}