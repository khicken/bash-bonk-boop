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
 * @param {string} name Name of the room (if set to null, name with number will be generated)
 * @param {string} password Password of the room (if set to null, 8-digit long password will be created)
 * @param {number} maxSize Maximum amount of people n the room (default is 10)
 */
 var room = (name, password, maxSize) => {
    var Name = name || 'Room ' + roomIndex.toString();
    var Password = password || generateID(8);
    var Id = generateID(10);
    var MaxSize = maxSize || 10;
    var CurrentSize = 0;
    var canJoin = true;
    var users = [];

    return {
        id: Id,
        name: Name,
        password: Password,
        maxSize: MaxSize,
        currentSize: CurrentSize,
        canJoin: true,
        /**
         * @returns {boolean} If the user can join, is true. Else, will return false
         */
        addPlayer(username) {
            if(MaxSize < users) {
                users.push(username);
                CurrentSize++;
                return true;
            }
            return false;
        },
        /**
         * @returns {boolean} Once the user has been removed
         */
        removePlayer(username) {
            users = users.filter((v) => {
                return v != username;
            }); // redefine array of elements of all elements other than the username
            CurrentSize--;
            return true;
        }
    }
}