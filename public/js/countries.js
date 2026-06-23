const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user) {
    window.location.href = 'index.html';
}

if (user.role !== 'ADMIN') {
    window.location.href = 'tickets.html';
}

const countryForm = document.getElementById('countryForm');
const countriesList = document.getElementById('countriesList');
const latinAmericanCountries = [
    { name: 'Argentina', code: 'AR' },
    { name: 'Bolivia', code: 'BO' },
    { name: 'Brasil', code: 'BR' },
    { name: 'Chile', code: 'CL' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Costa Rica', code: 'CR' },
    { name: 'Cuba', code: 'CU' },
    { name: 'Ecuador', code: 'EC' },
    { name: 'El Salvador', code: 'SV' },
    { name: 'Guatemala', code: 'GT' },
    { name: 'Honduras', code: 'HN' },
    { name: 'México', code: 'MX' },
    { name: 'Nicaragua', code: 'NI' },
    { name: 'Panamá', code: 'PA' },
    { name: 'Paraguay', code: 'PY' },
    { name: 'Perú', code: 'PE' },
    { name: 'Puerto Rico', code: 'PR' },
    { name: 'República Dominicana', code: 'DO' },
    { name: 'Uruguay', code: 'UY' },
    { name: 'Venezuela', code: 'VE' }
];

const countrySelect = document.getElementById('countrySelect');

latinAmericanCountries.forEach(country => {
    countrySelect.innerHTML += `
        <option value="${country.code}">
            ${country.name}
        </option>
    `;
});
const loadCountries = async () => {
    const response = await fetch(`${API_URL}/countries`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const result = await response.json();
    const countries = result.data || result;

    countriesList.innerHTML = '';

    countries.forEach(country => {
        countriesList.innerHTML += `
            <tr class="hover:bg-slate-50">
            <td class="p-4 whitespace-nowrap">
                <img
                    src="https://flagcdn.com/24x18/${country.code.toLowerCase()}.png"
                    alt="${country.name}"
                    class="w-8 h-6 rounded object-cover border"
                >
            </td>

                <td class="p-4 whitespace-nowrap font-semibold">
                    ${country.name}
                </td>

                <td class="p-4 whitespace-nowrap">
                    ${country.code}
                </td>

                <td class="p-4 whitespace-nowrap">
                    ${
                        country.isActive
                            ? '<span class="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">Activo</span>'
                            : '<span class="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">Inactivo</span>'
                    }
                </td>

                <td class="p-4 whitespace-nowrap">
                    <button
                        onclick="openDeleteCountryModal(${country.id}, '${country.name}')"
                        class="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    });
};

countryForm.addEventListener('submit', async (event) => {
    event.preventDefault();

const selectedCode = countrySelect.value;

if (!selectedCode) {
    alert('Seleccione un país');
    return;
}

const selectedCountry = latinAmericanCountries.find(
    country => country.code === selectedCode
);

const payload = {
    name: selectedCountry.name,
    code: selectedCountry.code,
    flagEmoji: selectedCountry.code
};
const existingCountry = Array.from(
    countriesList.querySelectorAll('tr')
).some(row =>
    row.textContent.includes(selectedCountry.name)
);

if (existingCountry) {
    openDuplicateCountryModal(selectedCountry.name);
    return;
}
    const response = await fetch(`${API_URL}/countries`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        alert(result.message || 'No se pudo crear el país');
        return;
    }

    countryForm.reset();
    loadCountries();
});

const openDeleteCountryModal = (id, name) => {
    document.getElementById('deleteCountryId').value = id;
    document.getElementById('deleteCountryText').textContent =
        `¿Seguro que deseas eliminar el país "${name}"?`;

    document.getElementById('deleteCountryModal').classList.remove('hidden');
};

const closeDeleteCountryModal = () => {
    document.getElementById('deleteCountryModal').classList.add('hidden');
};

const confirmDeleteCountry = async () => {
    const id = document.getElementById('deleteCountryId').value;

    const response = await fetch(`${API_URL}/countries/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        alert(result.message || 'No se pudo eliminar el país');
        return;
    }

    closeDeleteCountryModal();
    loadCountries();
};
const openDuplicateCountryModal = (countryName) => {

    document.getElementById('duplicateCountryText').textContent =
        `El país "${countryName}" ya se encuentra registrado.`;

    const modal =
        document.getElementById('duplicateCountryModal');

    const content =
        document.getElementById('duplicateCountryModalContent');

    modal.classList.remove('hidden');

    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
};

const closeDuplicateCountryModal = () => {

    const modal =
        document.getElementById('duplicateCountryModal');

    const content =
        document.getElementById('duplicateCountryModalContent');

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

loadCountries();