#!/bin/bash

########################################################################
#	- This is the main script that is used to compile/interpret the source code
#	- The script takes 3 arguments
#		1. The compiler that is to compile the source file.
#		2. The source file that is to be compiled/interpreted
#		3. Additional argument only needed for compilers, to execute the object code
#	
#	- Sample execution command:   $: ./script.sh g++ file.cpp ./a.out
#	
########################################################################

compiler=$1
file=$2
output=$3
addtionalArg=$4


########################################################################
#	- The script works as follows
#	- It first stores the stdout and std err to another stream
#	- The output of the stream is then sent to respective files
#	
#	
#	- if third arguemtn is empty Branch 1 is followed. An interpretor was called
#	- else Branch2 is followed, a compiler was invoked
#	- In Branch2. We first check if the compile operation was a success (code returned 0)
#	
#	- If the return code from compile is 0 follow Branch2a and call the output command
#	- Else follow Branch2b and output error Message
#	
#	- Stderr and Stdout are restored
#	- Once the logfile is completely written, it is renamed to "completed"
#	- The purpose of creating the "completed" file is because NodeJs searches for this file 
#	- Upon finding this file, the NodeJS Api returns its content to the browser and deletes the folder
#
#	
########################################################################



#3>&1 4>&2 >

cd /usercode

START=$(date +%s.%2N)
#Branch 1
if [ "$output" = "" ]; then
    exec  1> $"/usercode/logfile.txt"
	exec  2> $"/usercode/errors"
	$compiler #$file -< $"/usercode/in1.txt" #| tee /usercode/output.txt
#Branch 2
else
	#In case of compile errors, redirect them to a file
    exec  1> $"/usercode/buildlogfile.txt"
	exec  2> $"/usercode/errors"

	#exec 2> &1
	#exec 1> $"/usercode/errors"
	$compiler #$file $addtionalArg #&> /usercode/errors.txt
	#Branch 2a
	if [ $? -eq 0 ];	then
		exec 1> $"/usercode/logfile.txt"
		exec 2> $"/usercode/errors"
		echo "Build Successful"
		while read x y
		do
			# answer file post-processing (removing \r, trailing newline, etc.)
			sed -e :a -e 's/\r$//' -e '/^\n*$/{$d;N;};/\n$/ba' $y > $"result."$y

			#execution
			exec 1> $y$".current" 2>&1
			$output -< $x #| tee /usercode/output.txt

			# result is nonzero
			if [ $? -ne 0 ];	then
				#exec 1> $"/usercode/logfile.txt"
				# write runtime error message to output file directly
				printf "[Runtime Error (or main() returns non-zero value)]"
			fi

			# output file post-processing (removing \r, trailing newline, etc.)
			sed -e :a -e 's/\r$//' -e '/^\n*$/{$d;N;};/\n$/ba' $y$".current" > $"result."$y$".current"
			#cat $"result."$y
			#cat $"result."$y$".current"

			echo 'x' >> $"/usercode/logfile.txt"
			# output file diff check
			#diff -q $"result."$y $"result."$y$".current"
			# if passed, make a file named answerfile.passed
			#if [ $? -eq 0 ];	then
			#	echo 'x' > $y$".passed"
			#fi
			#$output -< $"/usercode/in1.txt" #| tee /usercode/output.txt
		done < $"/usercode/iofiles"
	#Branch 2b
	else
	    exec  1> $"/usercode/logfile.txt"
		echo "Build Failure"
		echo 'x' > "buildfailure"
		#cp $"/usercode/buildlogfile.txt" $"/usercode/logfile.txt"
		
	    #if compilation fails, display the output file	
	    #cat /usercode/errors.txt
	fi
fi

#exec 1>&3 2>&4

#head -100 /usercode/logfile.txt
#touch /usercode/completed
END=$(date +%s.%2N)
runtime=$(echo "1000.0 * ($END - $START)" | bc)

echo "*-COMPILEBOX::ENDOFOUTPUT-*" $runtime 


mv /usercode/logfile.txt /usercode/completed
