function handler(event, context, callback) {
    let text = "Hello Count how many characters";
    let length = text.length;

    callback(null, {
        statusCode: 200,
        body: length,
    });

}
module.exports = {handler};
