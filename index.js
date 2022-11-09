const fs = require("fs");
const Xlsx = require("xlsx");
const path = require("path");
const fastq = require("fastq");
const listFiles = require("./listFiles");

const dirPath = "/home/matheusthiesen/Desktop/TestImages/";
const noimage = path.resolve(__dirname, "SEM_IMAGEM.jpg");
const CONCURRENCY = 8;

function readdir(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, paths) => {
      if (err) {
        reject(err);
      } else {
        resolve(paths);
      }
    });
  });
}
function stat(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, dataStat) => {
      if (err) {
        reject(err);
      } else {
        resolve(dataStat);
      }
    });
  });
}
function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, dataRead) => {
      if (err) {
        reject(err);
      } else {
        resolve(dataRead);
      }
    });
  });
}
function copyFile(path, copyPath) {
  return new Promise((resolve, reject) => {
    fs.copyFile(path, copyPath, (err, dataRead) => {
      if (err) {
        reject(err);
      } else {
        resolve(dataRead);
      }
    });
  });
}
function writeFile(fileDatas) {
  const newFileCreate = Xlsx.utils.book_new();
  const newAbaCreate = Xlsx.utils.json_to_sheet(fileDatas);
  Xlsx.utils.book_append_sheet(newFileCreate, newAbaCreate, "Plan1");

  Xlsx.writeFile(
    newFileCreate,
    path.resolve(__dirname, `listagem-arquivos.csv`)
  );
}

async function worker({ filename, noimageRead, files }) {
  const fileread = await readFile(path.resolve(dirPath, filename));
  const isExistNoImage =
    noimageRead.toString("base64") === fileread.toString("base64");

  if (isExistNoImage) {
    const filenameSplit = filename.split("_");
    const [typeImage] = filenameSplit[filenameSplit.length - 1].split(".");

    if (Number(typeImage) <= 1) {
      const existSecondaryImage = files.filter((f) =>
        f.includes(filenameSplit[0] + "_02")
      );
      if (existSecondaryImage && existSecondaryImage[0]) {
        await copyFile(
          path.resolve(dirPath, existSecondaryImage[0]),
          path.resolve(dirPath, filename)
        );
      }
    }
  }
}

const queue = fastq.promise(worker, CONCURRENCY);

async function exec() {
  var fileData = [];

  const noimageRead = await readFile(noimage);
  const files = await readdir(dirPath);

  let count = 0;
  for (const filename of listFiles.listFiles) {
    const existFile = files.filter((f) => f.includes(filename));

    if (existFile && existFile[0]) {
      await queue.push({ filename, noimageRead, files });
    }

    count++;
    console.log(`carregado ${count} de ${listFiles.listFiles.length}`);
  }

  await writeFile(fileData);
}

exec();
