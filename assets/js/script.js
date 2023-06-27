function init() {
    fetch('https://api.kanye.rest')
        .then(function(response) {
            console.log(response);
            return response.json();
        })
        .then(function(data) {
            console.log(data);

        });
}

$(init);