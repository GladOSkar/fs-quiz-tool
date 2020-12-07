import setuptools as st

with open("README.md", "r") as f:
	long_description = f.read()

with open('LICENSE.md') as f:
    license_text = f.read()

st.setup(
	name="fs-quiz-tool-db",
	version="0.1.0",
	author="Oskar @ FaSTTUBe",
	author_email="o.winkels@fasttube.de",
	description="A tool to help FS teams train for registration qualification quizzes",
	long_description=long_description,
	long_description_content_type="text/markdown",
	url="https://git.fasttube.de/FaSTTUBe/fs-quiz-tool",
	packages=st.find_packages(exclude=['tests', 'docs']),
	install_requires=[
		"flask",
	],
	license=license_text,
	classifiers=[
		"Programming Language :: Python :: 3",
		"License :: OSI Approved :: GNU General Public License v3 (GPLv3)",
		"Operating System :: OS Independent",
	],
	python_requires='>=3.6',
)
