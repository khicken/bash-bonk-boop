// room object with id, name, password, max size, current size
var roomIndex = 1;
var room = (o) => {
    if(o.name)
        var thisName = o.name;
    else
        var thisName = ''

    return {
        id: thisId,
        name: thisName,
        password: thisPassword,
        maxSize: thisMaxSize,
        currentSize: thisCurrentSize
    }
}