/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

Vue.options.delimiters = ['$[', ']'];

$(function () {
    $('[data-toggle="tooltip"]').tooltip({ delay: { show: 500, hide: 50 } });
});

async function sendAsyncRequest(url, data, method = 'POST') {
    const response = await fetch(url, {
        method: method,
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'X-Async-Action': 'async'
        },
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        body: data ? JSON.stringify(data) : undefined
    });
    return await response.json();
}
