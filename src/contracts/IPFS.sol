//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IPFS {
	string public name = "IPFS";
	uint public imageCount = 0;

	mapping(uint => Image) public images;

	struct Image {
		uint id; //in this case it will just be the counter value
		string hash; //image hash from ipfs
		string description; //the body of the note
		uint tipAmount;
		address author;
	}

	event ImageCreated(
		uint id,
		string hash,
		string description,
		uint tipAmount,
		address author 
	);

	event ImageTipped(
		uint id,
		string hash,
		string description,
		uint tipAmount,
		address author
	);	

	//Create Images
	function uploadImage(string memory _imgHash, string memory _description) public {
		require(msg.sender != address(0x0), "sender has no address...");
		require(bytes(_imgHash).length > 0, "no image hash exists...");
		require(bytes(_description).length > 0, "no image description exists...");
		imageCount ++;//imageCount = imageCount + 1;
		images[imageCount] = Image(imageCount, _imgHash, _description, 0, msg.sender);
		emit ImageCreated(imageCount, _imgHash, _description, 0, msg.sender);
	}

	//Tip Images
	function tipImageOwner(uint _id) public payable {
		require(_id > 0 && _id <= imageCount);
		Image memory _image = images[_id];
		payable(address(_image.author)).transfer(msg.value);
		_image.tipAmount = _image.tipAmount + msg.value;
		images[_id] = _image;
		emit ImageTipped(_id, _image.hash, _image.description, _image.tipAmount, _image.author);
	}

}
