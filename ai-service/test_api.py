"""
Script test các API endpoints của Face Recognition Service
"""

import requests
import base64
import os

# Cấu hình
BASE_URL = "http://localhost:5001/"
TEST_IMAGE_PATH = "test_images/student2.jpg"  # Đường dẫn ảnh test

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ {message}{Colors.END}")

def print_section(title):
    print(f"\n{Colors.YELLOW}{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}{Colors.END}\n")

def image_to_base64(image_path):
    """Chuyển ảnh sang base64"""
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def test_health_check():
    print_section("1. Testing Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print_success("Health check passed")
            print_info(f"Status: {data.get('data', {}).get('status')}")
            print_info(f"Registered faces: {data.get('data', {}).get('registered_faces')}")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_register_face(student_id, image_path):
    print_section(f"2. Testing Face Registration - {student_id}")
    try:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            data = {'student_id': student_id}
            response = requests.post(f"{BASE_URL}/face/register", files=files, data=data)
        
        if response.status_code in [200, 201]:
            result = response.json()
            print_success(f"Registration successful: {result.get('message')}")
            print_info(f"Student ID: {result.get('data', {}).get('student_id')}")
            return True
        else:
            print_error(f"Registration failed: {response.json().get('message')}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_register_face_base64(student_id, image_path):
    print_section(f"3. Testing Face Registration (Base64) - {student_id}")
    try:
        base64_image = image_to_base64(image_path)
        payload = {'student_id': student_id, 'image': base64_image}
        response = requests.post(f"{BASE_URL}/face/register", json=payload)
        
        if response.status_code in [200, 201]:
            result = response.json()
            print_success(f"Registration successful: {result.get('message')}")
            return True
        else:
            print_error(f"Registration failed: {response.json().get('message')}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_recognize_face(image_path):
    print_section("4. Testing Face Recognition")
    try:
        base64_image = image_to_base64(image_path)
        payload = {'image': base64_image}  # gửi JSON base64 để tránh lỗi 415
        response = requests.post(f"{BASE_URL}/face/recognize", json=payload)
        
        if response.status_code == 200:
            result = response.json()
            print_success("Recognition successful")
            print_info(f"Student ID: {result.get('data', {}).get('student_id')}")
            print_info(f"Confidence: {result.get('data', {}).get('confidence')}%")
            return True
        else:
            print_error(f"Recognition failed: {response.json().get('message')}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_verify_face(student_id, image_path):
    print_section(f"5. Testing Face Verification - {student_id}")
    try:
        base64_image = image_to_base64(image_path)
        payload = {'student_id': student_id, 'image': base64_image}
        response = requests.post(f"{BASE_URL}/face/verify", json=payload)
        
        if response.status_code == 200:
            result = response.json()
            data = result.get('data', {})
            # Convert is_match sang bool để tránh lỗi JSON serialize
            if 'is_match' in data:
                data['is_match'] = bool(data['is_match'])
            print_success(f"Verification successful: {result.get('message')}")
            print_info(f"Is Match: {data.get('is_match')}")
            print_info(f"Confidence: {data.get('confidence')}%")
            return True
        else:
            print_error(f"Verification failed: {response.json().get('message')}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_get_registered():
    print_section("6. Testing Get Registered Students")
    try:
        response = requests.get(f"{BASE_URL}/face/registered")
        if response.status_code == 200:
            result = response.json()
            data = result.get('data', {})
            print_success(f"Retrieved {data.get('total')} registered students")
            print_info(f"Students: {', '.join(data.get('students', []))}")
            return True
        else:
            print_error("Failed to get registered students")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_statistics():
    print_section("7. Testing Statistics")
    try:
        response = requests.get(f"{BASE_URL}/statistics")
        if response.status_code == 200:
            result = response.json()
            data = result.get('data', {})
            print_success("Statistics retrieved")
            print_info(f"Total Registered: {data.get('total_registered')}")
            print_info(f"Last Updated: {data.get('last_updated')}")
            return True
        else:
            print_error("Failed to get statistics")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def test_delete_face(student_id):
    print_section(f"8. Testing Delete Face - {student_id}")
    try:
        response = requests.delete(f"{BASE_URL}/face/delete/{student_id}")
        if response.status_code == 200:
            result = response.json()
            print_success(f"Deleted successfully: {result.get('message')}")
            return True
        else:
            print_error(f"Delete failed: {response.json().get('message')}")
            return False
    except Exception as e:
        print_error(f"Error: {e}")
        return False

def run_all_tests():
    print(f"{Colors.BLUE}")
    print("=" * 60)
    print("  FACE RECOGNITION API TESTS")
    print("=" * 60)
    print(f"{Colors.END}")
    
    results = []

    results.append(("Health Check", test_health_check()))

    if os.path.exists(TEST_IMAGE_PATH):
        results.append(("Register Face (File)", test_register_face("TEST001", TEST_IMAGE_PATH)))
        results.append(("Register Face (Base64)", test_register_face_base64("TEST002", TEST_IMAGE_PATH)))
        results.append(("Recognize Face", test_recognize_face(TEST_IMAGE_PATH)))
        results.append(("Verify Face", test_verify_face("TEST001", TEST_IMAGE_PATH)))
    else:
        print_info(f"Test image not found: {TEST_IMAGE_PATH}")
        print_info("Skipping face registration/recognition tests")
    
    results.append(("Get Registered Students", test_get_registered()))
    results.append(("Statistics", test_statistics()))

    if os.path.exists(TEST_IMAGE_PATH):
        results.append(("Delete Face", test_delete_face("TEST001")))
        results.append(("Delete Face", test_delete_face("TEST002")))

    # Summary
    print_section("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    print(f"Total Tests: {total}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.END}")
    print(f"{Colors.RED}Failed: {total - passed}{Colors.END}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}✓ All tests passed!{Colors.END}")
    else:
        print(f"\n{Colors.RED}✗ Some tests failed!{Colors.END}")

if __name__ == "__main__":
    print_info("Starting API tests...")
    print_info(f"Base URL: {BASE_URL}")
    print_info(f"Test Image: {TEST_IMAGE_PATH}")
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Tests interrupted by user{Colors.END}")
    except Exception as e:
        print_error(f"Unexpected error: {e}")
