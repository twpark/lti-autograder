#include <iostream>
#include <cassert>

using namespace std;

int add(int a, int b);

int main() {
	cout << "checking add(1, 2) == 3..." << endl;
	assert(add(1, 2) == 3);

	cout << "checking add(10, 25) == 35..." << endl;
	assert(add(10, 25) == 35);

	cout << "Unit tests finished." << endl;
	return 0;
}
