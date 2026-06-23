const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'index.html';
}

const user = JSON.parse(
    localStorage.getItem('user')
);

if (!user || user.role !== 'USER') {
    window.location.href = 'dashboard.html';
}

const loadDashboard = async () => {

    try {

        document.getElementById('userName').textContent =
            `${user.name} · ${user.email}`;

        const response = await fetch(
            `${API_URL}/tickets/my`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const tickets = await response.json();

        const totalTickets =
            tickets.length;

        const pendingTickets =
            tickets.filter(
                t => t.status === 'PENDIENTE'
            ).length;

        const closedTickets =
            tickets.filter(
                t => t.status === 'FINALIZADO'
            ).length;

        document.getElementById('totalTickets').textContent =
            totalTickets;

        document.getElementById('pendingTickets').textContent =
            pendingTickets;

        document.getElementById('closedTickets').textContent =
            closedTickets;

        const latestContainer =
            document.getElementById('latestTickets');

        latestContainer.innerHTML = '';

        if (tickets.length === 0) {

            latestContainer.innerHTML = `
                <p class="text-slate-500">
                    No existen tickets registrados.
                </p>
            `;

            return;
        }

        tickets
            .sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            )
            .slice(0, 5)
            .forEach(ticket => {

                latestContainer.innerHTML += `
                    <a href="ticket-detail.html?id=${ticket.id}"
                       class="block border rounded-xl p-4 hover:bg-slate-50">

                        <div class="flex justify-between">

                            <div>

                                <p class="font-semibold">
                                    ${ticket.ticketNumber}
                                </p>

                                <p class="text-slate-600">
                                    ${ticket.subject}
                                </p>

                            </div>

                            <div class="text-right">

                                <p class="text-sm text-slate-500">
                                    ${new Date(ticket.createdAt)
                                        .toLocaleDateString('es-EC')}
                                </p>

                                <p class="font-semibold">
                                    ${ticket.status}
                                </p>

                            </div>

                        </div>

                    </a>
                `;
            });

    } catch (error) {

        console.error(error);
    }
};



loadDashboard();