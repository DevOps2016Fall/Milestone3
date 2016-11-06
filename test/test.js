var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../app');
var should = chai.should();

chai.use(chaiHttp);

describe('App Server ', function() {
  it('should response to /', function(done) {
    chai.request(server)
      .get('/')
      .end(function(err, res){
        res.should.have.status(200);
        done();
      });
  });
  it('404 no existings',function(done){
    chai.request(server)
    .get('/helloWorld')
    .end(function(err,res){
      res.should.have.status(404);
      done();
    });
  });
  it('fail tests',function(done){
    chai.request(server)
    .get('/feature')
    .end(function(err,res){
      res.should.have.status(200);
      done();
    });
  });
});
