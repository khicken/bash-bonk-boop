var roomIndex = 1;
var roomList = [];

/**
 * Returns a new array without the element given
 * @param {array} ary Array to be iterated through
 * @param {element} e Element that would like to be removed
 */
function removeFromArray(ary, e) {
    let out = [];
    for(let i = 0; i < ary.length; i++) {
        if(ary[i] != e) out.push(i);
    }
    return out;
}

/**
 * Checks if element is in array
 * @param {array} ary Array to be iterated through
 * @param {element} e Element that would like to be checked
 */
function checkInArray(ary, e) {
    for(let i = 0; i < ary.length; i++)
        if(ary[i] == e) return true;
    return false;
}

function generateID(len) {
    var out = '';
    var ref = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for(let i = 0; i < len; i++)
       out += ref.charAt(Math.floor(Math.random() * ref.length));
    return out;
}

/**
 * Room object with id, name, password, max size, current size
 * @param {string} name Name of the room (if set to null, name with number will be generated)
 * @param {string} password Password of the room (if set to null, 8-digit long password will be created)
 * @param {number} maxSize Maximum amount of people n the room (default is 10)
 */
module.exports = {
room: function(name, password, maxSize) {
    this.name = name || 'Room ' + roomIndex.toString();
    this.password = password || generateID(8);
    this.id = generateID(10);
    this.maxSize = maxSize || 10;
    this.currentSize = 0;

    let users = [];

    this.addPlayer = function(username) {
        if(this.currentSize < this.maxSize && !checkInArray(username)) {
            users.push(username);
            this.currentSize++;
            return true;
        }
        return false;
    };

    this.removePlayer = function(username) {
        users = removeFromArray(users, username);
        this.currentSize--;
    };
}
}