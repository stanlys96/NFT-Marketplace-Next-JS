const fs = require("fs");

let marketplace = require("../data/data.json");

export const marketplaceRepo = {
  getAll: () => marketplace,
  // getById: (id) =>
  //   marketplace.find((x) => x.token_id.toString() === id.toString()),
  // find: (x) => marketplace.find(x),
  create,
  // update,
  // delete: _delete,
};

function create() {
  const testObject = {
    id: 2,
    nft_address: "Walao Eh",
    token_id: 1,
    price: 5.43,
    seller: "Walao",
    action: "items_listed",
    last_updated: "WALAO EH",
    image_url: "WALAO EH",
    token_name: "WALAO",
    token_description: "HABIBU",
  };
  marketplace.push(testObject);
  saveData();
}

function saveData() {
  fs.writeFile("../data/data.json", JSON.stringify(marketplace, null, 4));
}
