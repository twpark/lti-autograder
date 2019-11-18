#include <iostream>
#include <cmath>

using namespace std;

void PrintGreetings() {
	cout << "+=========================+" << endl;
	cout << "|/\\/\\Falcon Calculator/\\/\\|" << endl;
	cout << "+=========================+" << endl;
}

void PrintByeBye() {
	cout << "Thank you for using Falcon Calculator!" << endl;
}

void PrintMenuError() {
	cout << "The choice is not valid." << endl;
}

void PrintCurrentValue(int value) {
	cout << "Current value: " << value << endl;
}

int MenuChoice() {
	cout << "1) Add    2) Subtract 3) Multiply" << endl;
	cout << "4) Divide 5) Modulo   6) Square root" << endl;
	cout << "7) Exit" << endl;
	cout << "Choose Functionality:" << endl;

	int choice;

	cin >> choice;

	return choice;
}

int InputAnotherValue() {
	cout << "Input another value:" << endl;
	int value;

	cin >> value;

	return value;
}

int Add(int a, int b) {
	int result = a + b;

	return result;
}

int Subtract(int a, int b) {
	int result = a - b;

	return result;
}

int Multiply(int a, int b) {
	int result = a * b;

	return result;
}

int Divide(int a, int b) {
	if (b == 0)
		return -1;

	int result = a / b;

	return result;
}

int Modulo(int a, int b) {
	if (b == 0)
		return -1;

	int result = a % b;

	return result;
}

int Sqrt(int a) {
	return sqrt(a);
}

void ErrorCheck(int &value) {
	if(value < 0 || value > 99999) {
		cout << "Calculation Error, resetting..." << endl;
		value = 0;
	}

}
