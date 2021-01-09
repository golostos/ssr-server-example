const root = document.getElementById('root')
const resource = '/dogs'

// @ts-ignore
if (window.SSR) checkPathname()

window.onpopstate = function (event) {
    checkPathname()
}

document.addEventListener('click', event => {
    // @ts-ignore
    const link = event.target.closest("[data-link]")
    if (link) {
        event.preventDefault()
        redirect(link.getAttribute('href'))
    }
})

function checkPathname() {
    const pathname = document.location.pathname
    if (pathname === `${resource}/` || pathname === `${resource}`) return renderDogs()
    if (pathname.match(/\/(\d+)$/)) return renderDog(pathname.match(/\/(\d+)$/)[1])
    if (pathname === `${resource}/new`) return renderNewDog()
    if (pathname.match(/\/(\d+)\/edit$/)) return renderEditDog(pathname.match(/\/(\d+)\/edit$/)[1])
    if (pathname === `${resource}/page-404`) return render404()
}

function redirect(href) {
    history.pushState({}, '', href)
    checkPathname()
}

async function renderDogs() {
    fetch('/api/dog').then(response => response.json()).then(dogs => {
        const list = dogs.reduce((acc, dog) => acc +
            /*html*/`
            <li class="list-group-item">
                <a class="link-primary" data-link href="${resource}/${dog.id}">${dog.name}</a>
                ${editButton(dog)}
                ${removeButton(dog)}
            </li>`,
            '')

        root.innerHTML = /*html*/`
            <h1>Dogs list</h1>
            <ul class="list-group dogs-list">${list}</ul>        
            <a class="btn btn-primary btn-full-width" data-link href="${resource}/new">Create a dog</a>        
        `
        // @ts-ignore
        if (window.SSR) finishRender()
    })
}

async function renderDog(id) {
    const response = await fetch('/api/dog/' + id)
    if (response.ok) {
        const dog = await response.json()
        root.innerHTML = /*html*/`
            <a class="link-primary" data-link href="${resource}/">Back to the main page</a>
            ${dogCard(dog)}
            <div>
                ${editButton(dog, 'edit')}
                ${removeButton(dog, 'remove')}
            </div>
            `
        // @ts-ignore
        if (window.SSR) finishRender()
    } else if (response.status === 404) {
        const message = await response.text()
        history.replaceState({}, '', `${resource}/page-404?message=${encodeURIComponent(message)}`)
        checkPathname()
    }
}

function renderNewDog() {    
    root.innerHTML = /*html*/`
        <a class="link-primary" data-link href="${resource}/">Back to the main page</a>        
        <form id="create-form" onsubmit="createDog(event)" action="/dogs/" method="post" name="dog">
            ${formContent()}
            <button type="submit" class="btn btn-primary">Create</button>
        </form>`    
    // @ts-ignore
    if (window.SSR) {
        checkUrlQuery()
        // @ts-ignore
        finishRender()
    }
}

async function renderEditDog(id) {
    const response = await fetch('/api/dog/' + id)
    if (response.ok) {
        const dog = await response.json()
        root.innerHTML = /*html*/`
            <a class="link-primary" data-link href="${resource}/">Back to the main page</a>
            <a class="link-primary" data-link href="${resource}/${dog.id}">Back to the view</a>
            <form onsubmit="editDog(event, ${dog.id})" action="/dogs/${dog.id}/edit" method="post" name="dog">
                ${formContent(dog)}
                <button type="submit" class="btn btn-primary">Update</button>
            </form>`
        // @ts-ignore
        if (window.SSR) {
            checkUrlQuery()
            // @ts-ignore
            finishRender()
        }
    } else if (response.status === 404) {
        const message = await response.text()
        history.replaceState({}, '', `${resource}/page-404?message=${encodeURIComponent(message)}`)
        checkPathname()
    }
}

function render404() {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    root.innerHTML = /*html*/`
        <a data-link href="${resource}/">Back to the main page</a>
        <h2>${message}</h2>`
    // @ts-ignore
    if (window.SSR) {
        // @ts-ignore
        window.statusCode = 404
        // @ts-ignore
        finishRender()
    }
}

async function createDog(event) {
    event.preventDefault()
    const form = event.target
    const response = await fetch('/api/dog', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: form[0].value,
            breed: form[1].value,
            age: form[2].value,
        })
    })
    if (response.ok) {
        history.pushState({}, '', `${resource}/`)
        checkPathname()
    } else if (response.status === 400) {
        const { errors } = await response.json()
        checkForm(form, errors)
    }
}

async function editDog(event, id) {
    event.preventDefault()
    const form = event.target
    const response = await fetch(`/api/dog/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: form[0].value,
            breed: form[1].value,
            age: form[2].value,
        })
    })
    if (response.ok) {
        history.pushState({}, '', `${resource}/${id}`)
        checkPathname()
    } else if (response.status === 404) {
        const message = await response.text()
        history.replaceState({}, '', `${resource}/page-404?message=${encodeURIComponent(message)}`)
        checkPathname()
    } else if (response.status === 400) {
        const { errors } = await response.json()
        checkForm(form, errors)
    }
}

async function removeDog(id) {
    if (confirm('Are you sure?')) {
        const response = await fetch('/api/dog/' + id, {
            method: 'DELETE'
        })
        if (response.ok) {
            history.pushState({}, '', `${resource}/`)
            checkPathname()
        } else {
            const message = await response.text()
            history.replaceState({}, '', `${resource}/page-404?message=${encodeURIComponent(message)}`)
            checkPathname()
        }
    }
}

/** 
 * @param {Element} form 
 * @param {Array} errors 
 */
function checkForm(form, errors) {
    const inputs = {
        name: form.querySelector('input[name="name"]'),
        breed: form.querySelector('input[name="breed"]'),
        age: form.querySelector('input[name="age"]')
    }
    inputs.name.classList.remove('is-invalid')
    inputs.breed.classList.remove('is-invalid')
    inputs.age.classList.remove('is-invalid')
    form.querySelectorAll('.invalid-feedback').forEach(el => el.remove())
    errors.forEach(err => {
        const input = inputs[err.param]
        input.classList.add('is-invalid')
        input.insertAdjacentHTML('afterend', `<div class="invalid-feedback">${err.msg}.</div>`)
    })
}

function checkUrlQuery() {
    if (location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const errors = JSON.parse(urlParams.get('errors'));
        const correct = JSON.parse(urlParams.get('correct'));
        if (errors && correct) {
            const form = document.querySelector('form[name="dog"]')
            Object.keys(correct).forEach(key => {
                const input = form.querySelector(`input[name="${key}"]`)
                const value = correct[key]
                input.setAttribute('value', value)
            })
            checkForm(form, errors)
            return true
        }
        return false
    }
    return false
}

function formContent(dog = { name: '', breed: '', age: '' }) {
    return /*html*/`
        <div class="mb-3">
            <label class="form-label" for="input-name">Name:</label>
            <input class="form-control" id="input-name" name="name" type="text" value="${dog.name}">
        </div>
        <div class="mb-3">
            <label class="form-label" for="input-breed">Breed:</label>
            <input id="input-breed" class="form-control" name="breed" type="text" value="${dog.breed}">
        </div>
        <div class="mb-3">
            <label class="form-label" for="input-age">Age:</label>
            <input id="input-age" class="form-control" name="age" type="text" value="${dog.age}">
        </div>
    `
}

function removeButton(dog, text = '') {
    return /*html*/`
    <button type="button" class="btn btn-outline-danger" style="user-select: auto;" onclick="removeDog(${dog.id})">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash"
            viewBox="0 0 16 16">
            <path
                d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z">
            </path>
            <path fill-rule="evenodd"
                d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z">
            </path>
        </svg>
        ${text}
    </button>
`}

function editButton(dog, text = '') {
    return /*html*/`
    <a class="btn btn-outline-primary" style="user-select: auto;" href="${resource}/${dog.id}/edit" data-link>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pen"
            viewBox="0 0 16 16">
            <path
                d="M13.498.795l.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001zm-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708l-1.585-1.585z">
            </path>
        </svg>
        ${text}
    </a>
`}

function dogCard(dog) {
    return /*html*/`
    <div class="card">
        <div class="card-header">Name: ${dog.name}</div>
        <ul class="list-group list-group-flush">
            <li class="list-group-item">ID: ${dog.id}</li>
            <li class="list-group-item">Breed: ${dog.breed}</li>
            <li class="list-group-item">Age: ${dog.age}</li>
            <li class="list-group-item">Created: ${new Date(dog.createdAt).toLocaleDateString()} - 
                ${new Date(dog.createdAt).toLocaleTimeString()}</li>
            <li class="list-group-item">Updated: ${new Date(dog.updatedAt).toLocaleDateString()} - 
                ${new Date(dog.updatedAt).toLocaleTimeString()}</li>
        </ul>
    </div>
    `
}