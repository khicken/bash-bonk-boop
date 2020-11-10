var roomIndex = 1;
var roomList = [];

function generateID(len) {
    var out = '';
    var ref = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for(let i = 0; i < len; i++)
       out += ref.charAt(Math.floor(Math.random() * ref.length));
    return out;
}

/**
 * Room object with id, name, password, max size, current size
 * @param {string, string, integer} o Name, Password, Max Size (respectively)
 */
 var room = (o) => {
    var Name = name || 'Room ' + roomIndex.toString();
    var Password = password || generateID(6);
    var Id = generateID(10);
    var MaxSize = maxSize || 10;
    var CurrentSize = 0;

    return {
        id: Id,
        name: Name,
        password: Password,
        maxSize: MaxSize,
        currentSize: CurrentSize
    }
}