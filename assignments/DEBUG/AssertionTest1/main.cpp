#include <iostream>
#include <cassert>

using namespace std;

void PrintGreetings();
void PrintByeBye();
void PrintMenuError();
void PrintCurrentValue(int);
int MenuChoice();
int InputAnotherValue();
int Add(int, int);
int Subtract(int, int);
int Multiply(int, int);
int Divide(int, int);
int Modulo(int, int);
int Sqrt(int);
void ErrorCheck(int &);

int main() {
	cout << "Testing PrintGreetings function..." << endl;
	PrintGreetings();
	cout << "Testing PrintCurrentValue function..." << endl;
	PrintCurrentValue(201);
	PrintCurrentValue(5928);
	// the following two lines prints menu, and take standard input
	cout << "Testing MenuChoice function..." << endl;
	assert(MenuChoice() == 5);
	assert(MenuChoice() == 7);
	cout << "Testing PrintMenuError function..." << endl;
	PrintMenuError();
	cout << "Testing PrintByeBye function..." << endl;
	PrintByeBye();
	cout << "Testing Add function..." << endl;
	assert(Add(10, 500) == 510);
	assert(Add(1080, 291) == 1371);
	cout << "Testing Subtract function..." << endl;
	assert(Subtract(3420, 209) == 3211);
	assert(Subtract(100, 53) == 47);
	cout << "Testing Multiply function..." << endl;
	assert(Multiply(100, 53) == 5300);
	assert(Multiply(3420, 20) == 68400);
	cout << "Testing Divide function..." << endl;
	assert(Divide(100, 53) == 1);
	assert(Divide(3420, 42) == 81);
	assert(Divide(2801, 0) == -1);
	cout << "Testing Modulo function..." << endl;
	assert(Modulo(100, 53) == 47);
	assert(Modulo(3420, 42) == 18);
	assert(Modulo(2801, 0) == -1);
	cout << "Testing Sqrt function..." << endl;
	assert(Sqrt(100) == 10);
	assert(Sqrt(3420) == 58);
	assert(Sqrt(2801) == 52);
	cout << "Testing ErrorCheck function..." << endl;
	int value = 0;
	ErrorCheck(value);
	assert(value == 0);
	value = 5329;
	ErrorCheck(value);
	assert(value == 5329);
	value = 2012124;
	ErrorCheck(value);  // this call will print error message and reset.
	assert(value == 0); // value should have reset to 0.
	value = 102933;
	ErrorCheck(value);  // this call will print error message and reset.
	assert(value == 0); // value should have reset to 0.
	value = -102;
	ErrorCheck(value);  // this call will print error message and reset.
	assert(value == 0); // value should have reset to 0.
	cout << "All test passed! Congratulations!" << endl;
}

