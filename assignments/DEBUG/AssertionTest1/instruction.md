# Calculator Part 1: Functions and Unit testing
You are now a part of Falcon Software Developers (so to say, for your motivation) and would like to create a calculator program. It is at its early stage of development and you thought the following usage scenario:
* The program greets an user.
* Repeat the following:
	* The program prints the current value.
	* The program prints the menu, and the user is supposed to choose its functionality among the following:
	   * 1. Add, 2. Subtract, 3. Multiply, 4. Division, 5. Modulo
		   * These functionalities needs another operand, so your program will ask it next, then calculate.
		   * For example:
			   * If your current value is 1 and the chosen functionality is Add
			   * The program asks another operand (say 3) and
			   * Put the result (1 + 3 => 4) back to the current value.
	   * 6. Square root
		   * Does not need another operand, will calculate it right away.
	   * 7. Exit
		   * Prints a bye bye message
		   * Then exit (i.e., return 0 in main())

You may want to start coding right now. However, wait for a moment please. In this assignment (i.e., part 1), your job is to implement **a set of functions** in `myfunc.cpp` so that these functions pass the predefined unit test (written in `main.cpp`). Refer to the recommended workflow:
1. Create a project in CLion.
2. Add a new C++ source file named `myfunc.cpp` and add it to the build targets
	* See the accompanied video linked on Canvas for how-tos and more details.
3. Copy and paste the following `main.cpp` contents in dependency files section to your `main.cpp` in CLion.
4. Implement the functions in your `myfunc.cpp`
5. Make sure that your functions pass all the unit tests.
	* Note: unit tests check the 'assertion's not what your functions print out. Make sure to adhere to the sample outputs below.
6. Submit your `myfunc.cpp` to the grader and check if it passes the grader.
	* Note: you may want to revise your output messages to pass the grader, even if your `myfunc.cpp` passes the unit tests.

## Constraints and error handling
As covered in class, there are specific constraints given to this program:
* The calculator works within a range between 0 and 99999, excluding negative numbers and ones beyond 5 digits in base 10.

## Functions you need to implement in myfunc.cpp
Also, you are asked to employ a test-driven development. That is, you are given with the following function specifications necessary for the calculator. Your job is to create a (CLion) project, then add myfunc.cpp to the project.

For more details, refer to the attached main.cpp for the function prototypes.

Function name | Specification | Parameters | Returns
-|-|-|-
PrintGreetings| Prints a greeting message (see below). | Nothing | Nothing
PrintByeBye | Prints a farewell message (see below). | Nothing | Nothing
PrintMenuError | Prints an error message (see below). | Nothing | Nothing
PrintCurrentValue | Prints the current value (see below for example). | integer | Nothing
MenuChoice | Prints the menu and get a user input (functionality choice), then return the user choice value | Nothing | integer
InputAnotherValue | Prompt a user to input another operand value, and return the user input value | Nothing | integer
Add | Do addition with the parameters | 2 integers | integer
Subtract| Do subtraction with the parameters | 2 integers | integer
Multiply| Do multiplication with the parameters. | 2 integers | integer
Divide| Do division with the parameters (first / second). Exception: return -1 if the second parameter is 0. | 2 integers | integer
Modulo| Do modulo operation with the parameters (first % second). Exception: return -1 if the second parameter is 0. | 2 integers | integer
Sqrt| Find a square root of the parameter value | integer | integer
ErrorCheck | Check if the value is out of range (i.e., negative integer or has more than 5 digits), if so, print an error message (see below) and set the value as 0 | integer, call by reference | Nothing

## Detailed message formats
Greeting message:
```plaintext
+=========================+
|/\/\Falcon Calculator/\/\|
+=========================+
```
Farewell message:
```plaintext
Thank you for using Falcon Calculator!
```
Menu choice prompt (no tabs):
```plaintext
1) Add    2) Subtract 3) Multiply
2) Divide 5) Modulo   6) Square root
3) Exit
Choose Functionality:
```
Menu error message:
```plaintext
The choice is not valid.
```
Current value message:
```plaintext
Current value: <value>
```
Value error message (ErrorCheck function)
```plaintext
Calculation Error, resetting...
```

