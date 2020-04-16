/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

Vue.options.delimiters = ['$[', ']'];

$(function () {
    $('[data-toggle="tooltip"]').tooltip({ delay: { show: 500, hide: 50 } });
});

async function sendAsyncRequest(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'X-Async-Action': 'async'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data)
    });
    return await response.json();
}
