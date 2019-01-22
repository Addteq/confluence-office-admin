var request = require('request');
var fs = require('fs');
var crypto = require('crypto');
var HashTable = require('hashtable');
var winston = require('winston');
var gm = require('gm');
var algo = 'md5';
var mkdirp = require('mkdirp');
var hashvalueofbig, hashvalueofsmall,
    diffUser, imageFile,
    width, height;

var isChecksumFileExistFlag = true, //Flag to check is checksum file exist.
    notChecksumFileFlag = true, //Flag to check the file is not checksum file.
    getHashCodeFlag = true, //Flag to get the hashcode of file or not
    isImageFileFlag = true, //Flag to check the file is image.
    isBigImageFlag = true, //Flag to check the file is big image file.
    isImageFlag = true, //Flag to check the file is image or not.
    noOfImages = true;


var hashtable = new HashTable(); //Intializing the hashtable to put the key as image name and value as image hash code.
var configurationFile = 'config.json'; //Configuration file from where user will get the directorioes, username, password and url.

//Parsing config.json to get value of username, password etc...
var configuration = JSON.parse(fs.readFileSync(configurationFile));

//Initializing logger.
var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.File)({
            name: 'info-file',
            filename: 'info.log',
            level: 'info'
        }),
        new(winston.transports.File)({
            name: 'error-file',
            filename: 'error.log',
            level: 'error'
        })
    ]
});

//Function for retriving username directories from test folder.
function getDirectories(path, callback) {
    callback(fs.readdirSync(path).filter(function(file) {
        return fs.statSync(path + '/' + file).isDirectory();
    }));
}

//Function to write a hash value of Images in a File.
function writeInFile(path, userName, hashvalue) {
    logger.log('info', ' Writing a new hashcode in Checksum File for : ' + userName);
    var fileName = userName + '-checksum.txt';
    fs.writeFile(path + '/' + fileName, hashvalue, function(err) {
        if (err) return logger.log('error', ' Error in writing file for : ' + userName);
    });
}

//Function to check does checksum file exist, if yes,
//than get hashvalue and compare the existing hash value of Image with old hash value exist in a file.
function checksumFileExist(path, userName, file) {
    var fileName = userName + '-checksum.txt';
    fs.exists(path + '/' + fileName, function(exists) {

        if (exists) {
            logger.log('info', ' Checksum file exist for : ' + file);
            isChecksumFileExistFlag = true;
        } else {
            logger.log('info', ' Checksum file does not exist for : ' + file);
            isChecksumFileExistFlag = false;
        }
        gethashvalues(path, userName);
        checkforhashvalues(path, userName, file, isChecksumFileExistFlag);
    });
}

//Function to get hash value from File of Images.
function gethashvalues(path, userName) {
    fs.readdirSync(path).filter(function(file) {
        if (notChecksumFileFlag) {
            logger.log('info', ' Getting hashcode from hashtable for : ' + file);
            hashvalueofbig = hashtable.get(file);
            notChecksumFileFlag = false;
        } else if (file != userName + '-checksum.txt') {
            logger.log('info', ' Getting hashcode from hashtable for : ' + file);
            hashvalueofsmall = hashtable.get(file);
            notChecksumFileFlag = true;
        }
    });
}

//Function to compare the hash code of existing Images with already hash code exist in a File.
function checkforhashvalues(path, userName, file, isChecksumFileExistFlag) {
    var fileName = userName + '-checksum.txt';
    var fs2 = require('fs');
    var big = hashvalueofbig; //Getting hashvalue of big image;
    var small = hashvalueofsmall; //Getting hashvalue of small image;
    var hashvalue = big + '\n' + small;

    if (isChecksumFileExistFlag) {
        var data = fs2.readFileSync(path + '/' + fileName).toString('utf8');

        data.split('\n').map(function(val) {
            if (getHashCodeFlag) {
                if (big != val) {
                    logger.log('info', ' New Generated hashcode is  different ');
                    fs.readdirSync(path).filter(function(file) {
                        if (isBigImageFlag) {
                            writeInFile(path, userName, hashvalue);
                            uploadBigPic(path, file, userName);
                            isBigImageFlag = false;
                        } else if (file != userName + '-checksum.txt') {
                            file = file;
                        }
                    });
                    isBigImageFlag = true;
                }
                getHashCodeFlag = false;
            } else {
                if (small != val) {
                    logger.log('info', ' New Generated hashcode is  different ');
                    writeInFile(path, userName, hashvalue);
                    uploadSmallPic(path, file, userName);
                }

                getHashCodeFlag = true;
            }
        });
    } else {
        writeInFile(path, userName, hashvalue);
        uploadPics(path, userName);
    }
}

//Function to upload Small and Big Image in a Confluence.
function uploadPics(path, userName) {
    fs.readdirSync(path).filter(function(file) {
        if (!isImageFileFlag && file != userName + '-checksum.txt') {
            logger.log('info', ' Upload Small pic for : ' + userName);
            uploadSmallPic(path, file, userName);
            isImageFileFlag = true;
        } else if (isImageFileFlag) {
            logger.log('info', ' Upload Big pic for : ' + userName);
            uploadBigPic(path, file, userName);
            isImageFileFlag = false;
        }
    });
}

//Function to resize the small pic.
function resizeSmallPic(width, height, path, file) {
    var image = gm(path + '/' + file);
    image.resize(width, height, "!")
        .autoOrient()
        .write(path + '/' + file, function(err) {
            if (!err)
                logger.log('info', ' Resize image Successfully : ' + ' for ' + file);
            else
                logger.log('error', ' Error in resizing small pic : ' + err + ' for ' + file);
        });
}

//Function to Get the size of Pic.
function sizeOfPic(path, file) {
    var image = gm(path + '/' + file);
    image.size(function(err, size) {
        if (!err) {

            if (size.width > 48)
                width = 48;
            else
                width = null;
            if (size.height > 48)
                height = 48;
            else
                height = null;

            resizeSmallPic(width, height, path, file);
        } else
            logger.log('error', ' Error in getting size : ' + err + ' for ' + file);
    });
}


//Function to upload Small Pic in Confluence.
function uploadSmallPic(path, file, userName) {
    sizeOfPic(path, file);

    fs.open(path + '/' + file, 'r+', function(err, fd) {
        if (err)
            logger.log('error', ' Error in stats of : ' + file);
        else {
            fs.fstat(fd, function(err, stats) {
                if (err)
                    logger.log('error', ' Error in opening : ' + file);
                else {
                    imgsmall = fs.readFileSync(path + '/' + file).toString('base64');

                    request({
                            method: 'POST',
                            url: configuration.url +
                                '/rpc/json-rpc/confluenceservice-v2/addProfilePicture'  +
                                '?os_username=' + configuration.username + '&os_password=' + configuration.password,

                            json: [userName, file, 'image/png', imgsmall]
                        },
                        function(err, res, body) {
                            if (err)
                                logger.log('error', ' Error in uploading small pic : ' + file);
                            else {
                                if (body != true)
                                    logger.log('error', ' Error in uploading small pic : ' + body.error.message + ' for ' + file);
                                else
                                    logger.log('info', ' Small pic uploading: ' + body + ' for ' + file);
                            }
                        }
                    );
                }
            });
        }
    });
}

//Function to upload Big Pic in Confluence.
function uploadBigPic(path, file, userName) {
    fs.open(path + '/' + file, 'r+', function(err, fd) {
        if (err) logger.log('error', ' Error in stats of : ' + file);
        else {
            fs.fstat(fd, function(err, stats) {
                if (err)
                    logger.log('error', ' Error in opening : ' + file);
                else {
                    imgBig = fs.readFileSync(path + '/' + file).toString('base64');

                    request({
                            method: 'POST',
                            url: configuration.url +
                                '/rest/userprofile/1.0/userProfilePictureManager/uploadProfilePic' +
                                '?os_username=' + configuration.username + '&os_password=' + configuration.password,
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            json: {
                                userName: userName, //user name whose profile pic you want to update.
                                profilePicString: imgBig, //Base64 of an image.
                                profilePicType: 'png', //Type of an image e.g jpg,png
                                crop: 'false', //crop selected area either true/false
                                changeSmallPic: false
                            }
                        },
                        function(err, res, body) {
                            if (err)
                                logger.log('error', ' Error in uploading big pic : ' + file);
                            else {
                                if (body.responseText != 'Uploaded Successfully...!!!')
                                    logger.log('error', ' Error in uploading big pic : ' + body.responseText + ' for ' + file);
                                else
                                    logger.log('info', ' Big pic uploading: ' + body.responseText + ' for ' + file);
                            }
                        });
                }
            });
        }
    });
}

//Function to Generate Hashcode of Images.
function createHashCodeOfImages(file, userName) {
    var path = configuration.dirpath + '/' + userName;
    logger.log('info', 'User : ' + userName);
    logger.log('info', ' Accessing : ' + file);

    fs.stat(path + '/' + file, function(error, stats) {
        if (error)
            logger.log('error', ' Error in stats of : ' + file);
        else {
            fs.open(path + '/' + file, "r", function(error, fd) {
                if (error)
                    logger.log('error', ' Error in opening : ' + file);
                else {
                    logger.log('info', ' Creating hash code using md5 for : ' + file);
                    var shasum = crypto.createHash(algo);
                    shasum.update(fs.readFileSync(path + '/' + file));
                    logger.log('info', ' Putting hashcode in hashtable of : ' + file);
                    hashtable.put(file, shasum.digest('hex'));
                    isChecksum(userName, file);

                    fs.close(fd);
                }
            });
        }
    });
}

function isChecksum(userName, file) {
    var path = configuration.dirpath + '/' + userName;

    if (diffUser != userName && !isImageFlag) {
        logger.log('error', ' Unable to process the images as only one image exist of user : ' + diffUser + ' i.e ' + imageFile);
        if (imageFile.indexOf('-big') > -1) {
            var path = configuration.dirpath + '/' + diffUser;
            uploadBigPic(path, imageFile, diffUser);
        }
        if (imageFile.indexOf('-small') > -1) {
            var path = configuration.dirpath + '/' + diffUser;
            uploadSmallPic(path, imageFile, diffUser);
        }
        isImageFlag = true;
    }

    if (isImageFlag) {
        isImageFlag = false;
        diffUser = userName;
        imageFile = file;
    } else if (!isImageFlag && file != userName + '-checksum.txt') {
        checksumFileExist(path, userName, file);
        isImageFlag = true;
    }
}

// Get list of active users and create the subdirectory for each username if it doesn't exist
request({
        method: 'POST',
        url: configuration.url +
        //'/rpc/json-rpc/confluenceservice-v2/addProfilePicture'  +
        '/rpc/json-rpc/confluenceservice-v2/getActiveUsers' +
            '?os_username=' + configuration.username + '&os_password=' + configuration.password,
        json: ['true']
    },
    function(err, response, body) {
        body.forEach(function(username) {
            var userPath = configuration.dirpath + '/' + username;

            mkdirp(userPath, function(err) {
                if (err) logger.log('error', 'Failed to create: ' + userPath + err);
                else logger.log('info', 'Creating or checking : ' + userPath + ' for user: ' + username);
            });

        });
    });



getDirectories(configuration.dirpath, function(result) {

    result.forEach(function(userName) {

        var path = configuration.dirpath + '/' + userName;
        var fileName = userName + '-checksum.txt';

        fs.readdirSync(path).filter(function(file) {

            if (file != fileName) {
                createHashCodeOfImages(file, userName);
            }
        });
    });

});
