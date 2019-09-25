/*
        *File: DockerSandbox.js
        *Author: Osman Ali Mian/Asad Memon
        *Created: 3rd June 2014
        *Revised on: 25th June 2014 (Added folder mount permission and changed executing user to nobody using -u argument)
        *Revised on: 30th June 2014 (Changed the way errors are logged on console, added language name into error messages)
*/

var debug = true;

/**
         * @Constructor
         * @variable DockerSandbox
         * @description This constructor stores all the arguments needed to prepare and execute a Docker Sandbox
         * @param {Number} timeout_value: The Time_out limit for code execution in Docker
         * @param {String} path: The current working directory where the current API folder is kept
         * @param {String} folder: The name of the folder that would be mounted/shared with Docker container, this will be concatenated with path
         * @param {String} vm_name: The TAG of the Docker VM that we wish to execute
         * @param {String} compiler_name: The compiler/interpretor to use for carrying out the translation
         * @param {String} file_name: The file_name to which source code will be written
         * @param {String} code: The actual code
         * @param {String} output_command: Used in case of compilers only, to execute the object code, send " " in case of interpretors
*/
var DockerSandbox = function(timeout_value,path,folder,assignment_folder,test_info,submitted_files,
    vm_name,compiler_name,file_name,code,output_command,
    languageName,e_arguments,stdin_data)
{

    this.timeout_value=timeout_value;
    this.path=path;
    this.folder=folder;
    this.assignment_folder = assignment_folder;
    this.test_info = test_info;
    this.submitted_files = submitted_files;
    this.vm_name=vm_name;
    this.compiler_name=compiler_name;
    this.file_name=file_name;
    this.code = code;
    this.output_command=output_command;
    this.langName=languageName;
    this.extra_arguments=e_arguments;
    this.stdin_data=stdin_data;
}


/**
         * @function
         * @name DockerSandbox.run
         * @description Function that first prepares the Docker environment and then executes the Docker sandbox 
         * @param {Function pointer} success ?????
*/
DockerSandbox.prototype.run = function(success) 
{
    var sandbox = this;

    this.prepare( function(){
        sandbox.execute(success);
    });
}


/*
         * @function
         * @name DockerSandbox.prepare
         * @description Function that creates a directory with the folder name already provided through constructor
         * and then copies contents of folder named Payload to the created folder, this newly created folder will be mounted
         * on the Docker Container. A file with the name specified in file_name variable of this class is created and all the
         * code written in 'code' variable of this class is copied into this file.
         * Summary: This function produces a folder that contains the source file and 2 scripts, this folder is mounted to our
         * Docker container when we run it.
         * @param {Function pointer} success ?????
*/
DockerSandbox.prototype.prepare = async function(success)
{
    const fsp = require('fs').promises; 
    var exec = require('child_process').exec;
    var fs = require('fs');
    var sandbox = this;

    try {
        // copy basic payload
        var cmd = "mkdir "+ this.path + this.folder
            + " && cp " + this.path + "/Payload/* " + this.path + this.folder
            + " && chmod 777 "+ this.path + this.folder;
        await exec(cmd);

        // copy stdin / answer files
        cmd = "cp " + this.assignment_folder + this.test_info.makefile + " ";
        var iofiles = "";
        for(var i in this.test_info.stdinfiles) {
            cmd += this.assignment_folder + this.test_info.stdinfiles[i] + " "
                + this.assignment_folder + this.test_info.answerfiles[i] + " ";

            iofiles += this.test_info.stdinfiles[i] + " " + this.test_info.answerfiles[i];
            iofiles += "\n"
        }
        cmd += this.path + this.folder;
        if (debug) console.log(cmd);
        await exec(cmd);

        await fsp.writeFile(sandbox.path + sandbox.folder  +"/iofiles", iofiles);

        // write submitted files
        var submitted_filenames = Object.keys(this.submitted_files);
        for(var i in submitted_filenames) {
            await fsp.writeFile(sandbox.path + sandbox.folder  +"/" + submitted_filenames[i], this.submitted_files[submitted_filenames[i]])
            if (debug) console.log("Writing " + sandbox.path + sandbox.folder  +"/" + submitted_filenames[i] + "...");
        }
        
        //await fsp.writeFile(sandbox.path + sandbox.folder+"/" + sandbox.file_name, sandbox.code)

        //console.log(sandbox.langName+" file was saved!");

        if (debug) console.log("exec: " + "chmod 777 \'" + sandbox.path + sandbox.folder + "/" + submitted_filenames[i] + "\'");
        await exec("chmod 777 \'" + sandbox.path + sandbox.folder + "/" + submitted_filenames[i] + "\'")
        
        //await fsp.writeFile(sandbox.path + sandbox.folder+"/inputFile", sandbox.stdin_data)
        //console.log("Input file was saved!");
        
        success();
    }
    catch (err) {
        console.log(err);
    }
}

/*
         * @function
         * @name DockerSandbox.execute
         * @precondition: DockerSandbox.prepare() has successfully completed
         * @description: This function takes the newly created folder prepared by DockerSandbox.prepare() and spawns a Docker container
         * with the folder mounted inside the container with the name '/usercode/' and calls the script.sh file present in that folder
         * to carry out the compilation. The Sandbox is spawned ASYNCHRONOUSLY and is supervised for a timeout limit specified in timeout_limit
         * variable in this class. This function keeps checking for the file "Completed" until the file is created by script.sh or the timeout occurs
         * In case of timeout an error message is returned back, otherwise the contents of the file (which could be the program output or log of 
         * compilation error) is returned. In the end the function deletes the temporary folder and exits
         * 
         * Summary: Run the Docker container and execute script.sh inside it. Return the output generated and delete the mounted folder
         *
         * @param {Function pointer} success ?????
*/

DockerSandbox.prototype.execute = async function(success)
{
    var exec = require('child_process').exec;
    const fsp = require('fs').promises; 
    var fs = require('fs');
    var myC = 0; //variable to enforce the timeout_value
    var sandbox = this;

    //this statement is what is executed
    var st = this.path+'DockerTimeout.sh ' + this.timeout_value + 's -e \'NODE_PATH=/usr/local/lib/node_modules\' -i -t -v  "' + this.path + this.folder + '":/usercode ' + this.vm_name + ' /usercode/script.sh ' + this.compiler_name + ' ' + this.file_name + ' ' + this.output_command+ ' ' + this.extra_arguments;
    //var st = this.path+'DockerTimeout.sh ' + this.timeout_value + 's -u mysql -e \'NODE_PATH=/usr/local/lib/node_modules\' -i -t -v  "' + this.path + this.folder + '":/usercode ' + this.vm_name + ' /usercode/script.sh ' + this.compiler_name + ' ' + this.file_name + ' ' + this.output_command+ ' ' + this.extra_arguments;
    
    //log the statement in console
    if (debug) console.log(st);

    //execute the Docker, This is done ASYNCHRONOUSLY
    exec(st);
    if (debug) console.log("------------------------------")
    //Check For File named "completed" after every 1 second
    var intid = setInterval(async function() 
        {
            //Displaying the checking message after 1 second interval, testing purposes only
            //console.log("Checking " + sandbox.path+sandbox.folder + ": for completion: " + myC);

            myC = myC + 1;

            var data = '';
            var data2 = '';
            var time = '';
            
            try {
                data = await fsp.readFile(sandbox.path + sandbox.folder + '/completed', 'utf8');
                
                // if readfile was successful:
                if (myC < sandbox.timeout_value) 
                {
                    if (debug) console.log("DONE")
                    //check for possible errors
                    try {
                        data2 = await fsp.readFile(sandbox.path + sandbox.folder + '/errors', 'utf8');
                        if(!data2)
                            data2="";

                        if (debug) console.log("Error file: ");
                        if (debug) console.log(data2);

                        if (debug) console.log("Main File");
                        if (debug) console.log(data);
    
                        var lines = data.toString().split('*-COMPILEBOX::ENDOFOUTPUT-*');
                        data=lines[0];
                        time=lines[1];
    
                        if (debug) console.log("Time: ");
                        if (debug) console.log(time);
    
                    }
                    catch (err) {
                        console.log(err);
                    }
                } 
            }
            catch(err) {
                //if file is not available yet and the file interval is not yet up: carry on
                if (myC < sandbox.timeout_value) {
                    return;
                }
                //if time is up. Save an error message to the data variable
                else 
                {
                    //Since the time is up, we take the partial output and return it.
                    try {
                        data = await fsp.readFile(sandbox.path + sandbox.folder + '/logfile.txt', 'utf8');
                        if (!data) data = "";

                        data += "\nExecution Timed Out";
                        if (debug) console.log("Timed Out: "+sandbox.folder+" "+sandbox.langName)

                        data2 = await fsp.readFile(sandbox.path + sandbox.folder + '/errors', 'utf8');
                        if(!data2) data2="";

                        var lines = data.toString().split('*---*');
                        data=lines[0];
                        time=lines[1];

                        if (debug) console.log("Time: ");
                        if (debug) console.log(time);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }
            }

            var files = {in: [], ans: [], out: [], pass: [], size: sandbox.test_info.stdinfiles.length};
            var passed = true;
            var message = 'Build Successful and Test Passed';
            try {
                await fsp.readFile(sandbox.path + sandbox.folder + '/buildfailure', 'utf8');
                // if open, build failure
                passed = false;
                message = 'Build Failed';
                files = null;
            }
            catch(err) {
                // build successful, so read outputs
                for(var i in sandbox.test_info.stdinfiles) {
                    if (debug) console.log('testcase checking #' + i + '...');

                    var _in = null, _ans = null;
                    try {
                        _in = await fsp.readFile(sandbox.path + sandbox.folder + '/' + sandbox.test_info.stdinfiles[i], 'utf8');
                        _ans = await fsp.readFile(sandbox.path + sandbox.folder + '/result.' + sandbox.test_info.answerfiles[i], 'utf8');
                        _in = _in.replace(/(\r)/gm, '').trim();
                        _ans = _ans.replace(/(\r)/gm, '').trim();
    
                        files.in.push(_in);
                        files.ans.push(_ans);
                    }
                    catch(err) {
                        // shouldn't reach here
                        console.log('read error: stdin/answer file ' + err);
                    }
    
                    var _out = null;
                    try {
                        _out = await fsp.readFile(sandbox.path + sandbox.folder + '/result.' + sandbox.test_info.answerfiles[i] + '.current', 'utf8');
                        _out = _out.replace(/(\r)/gm, '').trim();
                        _out = _out.replace('/usercode/script.sh: line 107:', '');
                        _out = _out.replace('$output - < $x', '');
                    }
                    catch(err) {
                        // output file missing
                        if (debug) console.log('no output file: ' + sandbox.test_info.answerfiles[i]);
                        _out = null;
                    }
                    files.out.push(_out);

                    // compare _ans and _out to check if they are same
                    if (_out == _ans) {
                        if (debug) console.log('testcase output test: ' + (_out == _ans));
                        files.pass.push(_out == _ans);
                    }
                    else {
                        if (debug) console.log('test case failed');
                        files.pass.push(false);
                        passed = false;
                        message = 'Test case failed';
                    }
                }
            }
            

            //return the data to the calling function
            success(passed,message,files,time,data2);

            //now remove the temporary directory
            if (debug) console.log("ATTEMPTING TO REMOVE: " + sandbox.folder);
            if (debug) console.log("------------------------------")
            exec("rm -r " + sandbox.folder);

            
            clearInterval(intid);
        }, 1000);
}


module.exports = DockerSandbox;
